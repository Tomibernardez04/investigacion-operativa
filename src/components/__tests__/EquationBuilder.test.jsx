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

    it('handles typing and backspacing in nVars without premature jumping or clamping', () => {
        const setNVars = vi.fn();
        const setC = vi.fn();
        const setConstraints = vi.fn();

        render(
            <EquationBuilder
                sense="MAX"
                setSense={vi.fn()}
                nVars={2}
                setNVars={setNVars}
                nRows={2}
                setNRows={vi.fn()}
                c={['3', '5']}
                setC={setC}
                constraints={[
                    { coeffs: ['1', '2'], sign: '<=', rhs: '8' },
                    { coeffs: ['3', '2'], sign: '<=', rhs: '12' }
                ]}
                setConstraints={setConstraints}
            />
        );

        const nVarsInput = screen.getByLabelText(/Variables de Decisión/i);
        expect(nVarsInput.value).toBe('2');

        // Simulate backspace (empty string)
        fireEvent.change(nVarsInput, { target: { value: '' } });
        expect(nVarsInput.value).toBe('');
        // setNVars should NOT have been called with 1 prematurely
        expect(setNVars).not.toHaveBeenCalled();

        // Simulate typing 3
        fireEvent.change(nVarsInput, { target: { value: '3' } });
        expect(nVarsInput.value).toBe('3');
        expect(setNVars).toHaveBeenCalledWith(3);
    });

    it('clamps values on blur if user enters out-of-range or leaves empty', () => {
        const setNVars = vi.fn();

        render(
            <EquationBuilder
                sense="MAX"
                setSense={vi.fn()}
                nVars={2}
                setNVars={setNVars}
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

        const nVarsInput = screen.getByLabelText(/Variables de Decisión/i);

        // Clear and blur
        fireEvent.change(nVarsInput, { target: { value: '' } });
        fireEvent.blur(nVarsInput);
        expect(nVarsInput.value).toBe('1');
        expect(setNVars).toHaveBeenCalledWith(1);

        // Enter 99 and blur -> clamps to 6
        fireEvent.change(nVarsInput, { target: { value: '99' } });
        fireEvent.blur(nVarsInput);
        expect(nVarsInput.value).toBe('6');
        expect(setNVars).toHaveBeenCalledWith(6);
    });
});
