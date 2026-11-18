import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EquationBuilder from '../EquationsTab/EquationBuilder.jsx';

describe('EquationBuilder Component', () => {
    it('renders the equation configuration inputs (sense, nVars, nRows)', () => {
        const setSense = vi.fn();
        const setNVars = vi.fn();
        const setNRows = vi.fn();

        render(
            <EquationBuilder
                sense="MAX"
                setSense={setSense}
                nVars={2}
                setNVars={setNVars}
                nRows={3}
                setNRows={setNRows}
                c={['3', '5']}
                setC={vi.fn()}
                constraints={[
                    { coeffs: ['1', '2'], sign: '<=', rhs: '8' },
                    { coeffs: ['3', '2'], sign: '<=', rhs: '12' },
                    { coeffs: ['1', '0'], sign: '<=', rhs: '2' }
                ]}
                setConstraints={vi.fn()}
            />
        );

        expect(screen.getByLabelText(/Sentido:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Variables de Decisión/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Restricciones/i)).toBeInTheDocument();
    });

    it('changes sense when select is modified', () => {
        const setSense = vi.fn();
        render(
            <EquationBuilder
                sense="MAX"
                setSense={setSense}
                nVars={2}
                setNVars={vi.fn()}
                nRows={2}
                setNRows={vi.fn()}
                c={['3', '5']}
                setC={vi.fn()}
                constraints={[
                    { coeffs: ['1', '2'], sign: '<=', rhs: '8' },
                    { coeffs: ['3', '2'], sign: '<=', rhs: '12' }
                ]}
                setConstraints={vi.fn()}
            />
        );

        const select = screen.getByLabelText(/Sentido:/i);
        fireEvent.change(select, { target: { value: 'MIN' } });
        expect(setSense).toHaveBeenCalledWith('MIN');
    });
});
