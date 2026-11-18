import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Graphic2D from '../Graphic2D.jsx';
import EquationsTab from '../EquationsTab/EquationsTab.jsx';
import { PRESETS } from '../../data/presets.js';
import { solveSimplexWithHistory } from '../../logic/simplex.js';

describe('Graphic2D Component Fidelity', () => {
    it('renders 2D Cartesian plane with constraint arrows, badges, Z-level line, and legend', () => {
        const preset = PRESETS['slides_metal'];
        const history = solveSimplexWithHistory(preset.sense, preset.origCosts.slice(0, 2), preset.eqCoeffs);
        const handleIterChange = vi.fn();
        const handleClose = vi.fn();

        const { container } = render(
            <Graphic2D
                history={history}
                currentIter={0}
                varPrefix="x"
                funcName="Z"
                onIterChange={handleIterChange}
                onClose={handleClose}
            />
        );

        // Header controls
        expect(screen.getByText(/Gráfico 2D \(x₁ vs x₂\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Iter 0\//i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '75%' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '125%' })).toBeInTheDocument();

        // Check SVG element
        const svg = container.querySelector('svg.simplex-2d-svg');
        expect(svg).toBeInTheDocument();

        // Constraint lines and direction arrows exist
        const constraintBadges = screen.getAllByText(/R\d+/);
        expect(constraintBadges.length).toBeGreaterThan(0);

        // Level line of Z text exists inside SVG
        const zLabel = svg.querySelector('text[fill="#fbbf24"]');
        expect(zLabel).toBeInTheDocument();
        expect(zLabel.textContent).toBe('Z');

        // Legend below graphic
        expect(screen.getByText(/📍 Punto actual:/i)).toBeInTheDocument();
        expect(screen.getByText(/Región Factible/i)).toBeInTheDocument();
        expect(screen.getByText(/Recta Nivel Z/i)).toBeInTheDocument();
        expect(screen.getByText(/Trayectoria Simplex/i)).toBeInTheDocument();

        // Stepper buttons on 2D graphic
        const nextBtn = screen.getByRole('button', { name: /Sig ▶/i });
        fireEvent.click(nextBtn);
        expect(handleIterChange).toHaveBeenCalledWith(1);

        const closeBtn = screen.getByRole('button', { name: '✕' });
        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalled();
    });

    it('displays explanatory message when problem has 3 or more decision variables', () => {
        const threeVarHistory = PRESETS['ex_4_2'];
        render(
            <Graphic2D
                history={threeVarHistory}
                currentIter={0}
                varPrefix="x"
                funcName="Z"
            />
        );

        expect(screen.getByText(/Método Gráfico No Aplicable \(3 variables de decisión\)/i)).toBeInTheDocument();
    });
});

describe('EquationsTab Preset Loading & State Cleanliness', () => {
    it('closes any active calculation panel below when switching example presets', () => {
        render(<EquationsTab />);

        // Open Simplex panel
        const solveBtn = screen.getByRole('button', { name: /1\. Resolver Primal por Simplex/i });
        fireEvent.click(solveBtn);

        expect(screen.getByText(/Resolución Completa por Método Simplex/i)).toBeInTheDocument();

        // Now click on a different preset in PresetBar
        const altPresetBtn = screen.getByRole('button', { name: /Diapo 20: Soluciones Alternativas/i });
        fireEvent.click(altPresetBtn);

        // Active panel should now be closed to cleanly reset state
        expect(screen.queryByText(/Resolución Completa por Método Simplex/i)).not.toBeInTheDocument();
    });
});
