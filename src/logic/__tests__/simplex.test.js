import { describe, it, expect } from 'vitest';
import { F } from '../math.js';
import { solveSimplexWithHistory } from '../simplex.js';

describe('Simplex Engine - Standard & Edge Cases', () => {
    it('solves standard feasible problem with unique optimal solution', () => {
        // Max Z = 3x1 + 5x2
        // x1 + 2x2 <= 8
        // 3x1 + 2x2 <= 12
        const sense = 'MAX';
        const costs = [F(3), F(5)];
        const constraints = [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);

        expect(res.verdict).toBe('OPTIMAL_UNIQUE');
        expect(res.Z.toTex()).toBe('21');
        
        // Check optimal base has x1 and x2
        const x1Row = res.base.find(b => b.var === 'x1');
        const x2Row = res.base.find(b => b.var === 'x2');
        expect(x1Row).toBeDefined();
        expect(x2Row).toBeDefined();
        expect(x1Row.B.toTex()).toBe('2');
        expect(x2Row.B.toTex()).toBe('3');
    });

    it('detects multiple optimal (alternative) solutions', () => {
        // Max Z = 2x1 + 4x2
        // x1 + 2x2 <= 8
        // 3x1 + 2x2 <= 12
        const sense = 'MAX';
        const costs = [F(2), F(4)];
        const constraints = [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toContain('OPTIMAL_ALT');
        expect(res.Z.toTex()).toBe('16');
        expect(res.alternativeData).toBeDefined();
        expect(res.alternativeData.hasAlternatives).toBe(true);
    });

    it('detects degenerate optimal solution', () => {
        // Max Z = 3x1 + 2x2
        // x1 + x2 <= 4
        // 2x1 + x2 <= 6
        // x1 <= 2
        const sense = 'MAX';
        const costs = [F(3), F(2)];
        const constraints = [
            { coeffs: [F(1), F(1)], sign: '<=', rhs: F(4) },
            { coeffs: [F(2), F(1)], sign: '<=', rhs: F(6) },
            { coeffs: [F(1), F(0)], sign: '<=', rhs: F(2) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toContain('DEGENERATE');
        expect(res.Z.toTex()).toBe('10');
        // At least one basic variable with B = 0
        expect(res.base.some(b => b.B.isZero())).toBe(true);
    });

    it('detects incompatible / infeasible problem with artificial variables in base', () => {
        // Max Z = 3x1 + 2x2
        // x1 + x2 <= 2
        // x1 + x2 >= 4
        const sense = 'MAX';
        const costs = [F(3), F(2)];
        const constraints = [
            { coeffs: [F(1), F(1)], sign: '<=', rhs: F(2) },
            { coeffs: [F(1), F(1)], sign: '>=', rhs: F(4) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toBe('INCOMPATIBLE');
    });

    it('detects unbounded problem (open polygon)', () => {
        // Max Z = 2x1 + x2
        // x1 - x2 <= 10
        // 2x1 - x2 <= 40
        const sense = 'MAX';
        const costs = [F(2), F(1)];
        const constraints = [
            { coeffs: [F(1), F(-1)], sign: '<=', rhs: F(10) },
            { coeffs: [F(2), F(-1)], sign: '<=', rhs: F(40) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toBe('UNBOUNDED');
    });

    it('solves minimization problem with Big-M artificial variables correctly', () => {
        // Min Z = 2x1 + 3x2
        // x1 + x2 >= 5
        // x1 + 2x2 >= 6
        const sense = 'MIN';
        const costs = [F(2), F(3)];
        const constraints = [
            { coeffs: [F(1), F(1)], sign: '>=', rhs: F(5) },
            { coeffs: [F(1), F(2)], sign: '>=', rhs: F(6) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toBe('OPTIMAL_UNIQUE');
        expect(res.Z.toTex()).toBe('11'); // x1 = 4, x2 = 1 -> 2*4 + 3*1 = 11
    });

    it('handles negative RHS by multiplying row by -1 and flipping sign', () => {
        // -x1 - 2x2 >= -8  => multiplied by -1: x1 + 2x2 <= 8
        const sense = 'MAX';
        const costs = [F(3), F(5)];
        const constraints = [
            { coeffs: [F(-1), F(-2)], sign: '>=', rhs: F(-8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ];

        const res = solveSimplexWithHistory(sense, costs, constraints);
        expect(res.verdict).toBe('OPTIMAL_UNIQUE');
        expect(res.Z.toTex()).toBe('21');
    });
});
