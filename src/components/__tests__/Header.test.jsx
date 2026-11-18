import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from '../Header.jsx';

describe('Header Component', () => {
    it('renders the title and all 4 navigation tabs', () => {
        const setActiveTab = vi.fn();
        render(<Header activeTab="equations" setActiveTab={setActiveTab} />);

        expect(screen.getByText('Investigación Operativa')).toBeInTheDocument();
        expect(screen.getByText(/Desde Ecuaciones/i)).toBeInTheDocument();
        expect(screen.getByText(/Paso a Paso/i)).toBeInTheDocument();
        expect(screen.getByText(/Practicar/i)).toBeInTheDocument();
        expect(screen.getByText(/Reglas de Diapos/i)).toBeInTheDocument();
    });

    it('calls setActiveTab when clicking a tab button', () => {
        const setActiveTab = vi.fn();
        render(<Header activeTab="equations" setActiveTab={setActiveTab} />);

        const stepperTab = screen.getByText(/Paso a Paso/i);
        fireEvent.click(stepperTab);

        expect(setActiveTab).toHaveBeenCalledWith('stepper');
    });
});
