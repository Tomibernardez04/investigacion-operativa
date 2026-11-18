import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';

describe('App Full Integration & Usability Tests', () => {
    it('renders the complete application header and default equations view', () => {
        render(<App />);

        expect(screen.getByText('Investigación Operativa')).toBeInTheDocument();
        expect(screen.getByText(/1\. Ecuaciones Iniciales del Problema Directo/i)).toBeInTheDocument();
        expect(screen.getByText(/📁 Cargar Ejemplos:/i)).toBeInTheDocument();
    });

    it('switches between all navigation tabs properly', () => {
        render(<App />);

        // Switch to Tutorial Tab
        const tutorialTabBtn = screen.getByRole('button', { name: /🎬 Paso a Paso \(Tutorial\)/i });
        fireEvent.click(tutorialTabBtn);
        expect(screen.getByText(/Tutorial Paso a Paso: De la Tabla Primal a la Tabla Dual/i)).toBeInTheDocument();

        // Switch to Practice / Verifier Tab
        const verifierTabBtn = screen.getByText(/Practicar \/ Verificar/i);
        fireEvent.click(verifierTabBtn);
        expect(screen.getByText(/Modo Práctica: Ingresá tus resultados del Dual/i)).toBeInTheDocument();

        // Switch to Theory Tab
        const theoryTabBtn = screen.getByText(/Reglas de Diapos/i);
        fireEvent.click(theoryTabBtn);
        expect(screen.getByText(/Reglas de Signos del Pasaje de Tablas/i)).toBeInTheDocument();

        // Switch back to Equations
        const equationsTabBtn = screen.getByText(/Desde Ecuaciones/i);
        fireEvent.click(equationsTabBtn);
        expect(screen.getByText(/1\. Ecuaciones Iniciales del Problema Directo/i)).toBeInTheDocument();
    });

    it('opens Simplex panel and interacts with stepper controls', () => {
        render(<App />);

        const solveBtn = screen.getByText(/1\. Resolver Primal por Simplex/i);
        fireEvent.click(solveBtn);

        // Check panel opened
        expect(screen.getByText(/Resolución Completa por Método Simplex/i)).toBeInTheDocument();
        expect(screen.getByText(/Tabla Inicial/i)).toBeInTheDocument();

        // Advance stepper
        const nextBtn = screen.getByText(/Siguiente ▶/i);
        fireEvent.click(nextBtn);
        expect(screen.getByText(/Iteración 1/i)).toBeInTheDocument();

        // Close panel
        const closeBtn = screen.getByText(/✕ Ocultar/i);
        fireEvent.click(closeBtn);
        expect(screen.queryByText(/Resolución Completa por Método Simplex/i)).not.toBeInTheDocument();
    });

    it('allows verifying student dual table answers in Practice mode', () => {
        render(<App />);

        // Go to verifier
        const verifierTabBtn = screen.getByText(/Practicar \/ Verificar/i);
        fireEvent.click(verifierTabBtn);

        // Click reveal solution
        const revealBtn = screen.getByText(/⚡ Revelar Solución/i);
        fireEvent.click(revealBtn);

        // Verify success badge appears
        expect(screen.getByText(/¡IMPECABLE!/i)).toBeInTheDocument();
    });
});
