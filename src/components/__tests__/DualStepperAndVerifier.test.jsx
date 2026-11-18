import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmbeddedDualStepperPanel from '../EquationsTab/EmbeddedDualStepperPanel.jsx';
import DualEquationsPanel from '../EquationsTab/DualEquationsPanel.jsx';
import VerifierTab from '../VerifierTab.jsx';
import { PRESETS } from '../../data/presets.js';
import { Fraction } from '../../logic/math.js';

describe('EmbeddedDualStepperPanel & Step 6 Verdict', () => {
    it('navigates from Step 0 to Step 6 and renders the Fundamental Theorem comparison card', () => {
        const primalData = PRESETS['slides_metal'];
        render(<EmbeddedDualStepperPanel primalData={primalData} />);

        // Starts at Step 0
        expect(screen.getByText(/Paso 0 de 6/i)).toBeInTheDocument();
        expect(screen.getByText(/Tabla Óptima Primal y Mapeo/i)).toBeInTheDocument();

        // Advance to step 6 using "⏭ Fin"
        const endBtn = screen.getByRole('button', { name: /⏭ Fin/i });
        fireEvent.click(endBtn);

        expect(screen.getByText(/Paso 6 de 6/i)).toBeInTheDocument();
        expect(screen.getByText(/Correlación y Teorema Fundamental de la Dualidad/i)).toBeInTheDocument();

        // Check Step 6 verdict card elements
        expect(screen.getByText(/Z\* = W\* = 15000/i)).toBeInTheDocument();
        expect(screen.getByText(/Problema Directo \(Primal\):/i)).toBeInTheDocument();
        expect(screen.getByText(/Problema Dual:/i)).toBeInTheDocument();
    });

    it('displays degenerate and alternative pills in tables for relevant problem presets', () => {
        const altData = PRESETS['casos_particulares_alt'];
        render(<EmbeddedDualStepperPanel primalData={altData} />);

        // Advance to step 6
        const endBtn = screen.getByRole('button', { name: /⏭ Fin/i });
        fireEvent.click(endBtn);

        // Check that the alternative/degeneracy correlation is diagnosed
        expect(screen.getByText(/Teorema Fundamental: Primal Alternativo/i)).toBeInTheDocument();
    });
});

describe('DualEquationsPanel', () => {
    it('renders unified symbolic formulation and allows direct dual simplex solving', () => {
        const primalData = PRESETS['slides_metal'];
        const costs = primalData.origCosts.slice(0, 2);
        const constrs = primalData.eqCoeffs;

        render(
            <DualEquationsPanel
                sense={primalData.sense}
                c={costs}
                constraints={constrs}
                primalOptZ="15000"
            />
        );

        // Header and unified formulation
        expect(screen.getByText(/Formulación Simbólica del Problema Dual/i)).toBeInTheDocument();

        // Click button to solve dual simplex
        const solveDualBtn = screen.getByRole('button', { name: /⚡ Resolver Dual por Simplex/i });
        fireEvent.click(solveDualBtn);

        // Check that dual simplex stepper appears with W* and Fundamental Theorem
        expect(screen.getByText(/Tabla Inicial del Dual/i)).toBeInTheDocument();
    });
});

describe('VerifierTab', () => {
    it('renders initial equations box and provides automated solution feedback', () => {
        render(<VerifierTab />);

        // Initial equations box exists
        expect(screen.getByText(/Sujeto a las restricciones:/i)).toBeInTheDocument();

        // Click reveal solution
        const revealBtn = screen.getByRole('button', { name: /⚡ Revelar Solución/i });
        fireEvent.click(revealBtn);

        // Check that success feedback is shown
        expect(screen.getByText(/¡IMPECABLE!/i)).toBeInTheDocument();
    });
});
