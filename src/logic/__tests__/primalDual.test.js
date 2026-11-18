import { describe, it, expect } from 'vitest';
import { F } from '../math.js';
import { buildDualProblemFromPrimal, solveDual } from '../primalDual.js';
import { solveSimplexWithHistory } from '../simplex.js';

describe('Primal-Dual Transformation Rules', () => {
    it('correctly constructs Dual from standard MAX Primal', () => {
        // Primal: Max Z = 3x1 + 5x2
        // R1: x1 + 2x2 <= 8
        // R2: 3x1 + 2x2 <= 12
        // x1, x2 >= 0
        const sense = 'MAX';
        const costs = [F(3), F(5)];
        const constraints = [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ];

        const dual = buildDualProblemFromPrimal(sense, costs, constraints);

        // Dual: Min W = 8y1 + 12y2
        expect(dual.dualSense).toBe('MIN');
        expect(dual.dualFunc).toBe('W');
        expect(dual.dualCosts.map(c => c.toTex())).toEqual(['8', '12']);
        
        // Dual Constraints:
        // y1 + 3y2 >= 3
        // 2y1 + 2y2 >= 5
        expect(dual.dualConstraints.length).toBe(2);
        expect(dual.dualConstraints[0].coeffs.map(c => c.toTex())).toEqual(['1', '3']);
        expect(dual.dualConstraints[0].sign).toBe('>=');
        expect(dual.dualConstraints[0].rhs.toTex()).toBe('3');

        expect(dual.dualConstraints[1].coeffs.map(c => c.toTex())).toEqual(['2', '2']);
        expect(dual.dualConstraints[1].sign).toBe('>=');
        expect(dual.dualConstraints[1].rhs.toTex()).toBe('5');

        // Dual Variable signs: both y1, y2 >= 0
        expect(dual.dualVarSigns).toEqual(['>= 0', '>= 0']);
    });

    it('correctly constructs Dual from MIN Primal with mixed constraints', () => {
        // Primal: Min Z = 2x1 + 3x2
        // R1: x1 + x2 >= 5
        // R2: x1 + 2x2 = 6
        const sense = 'MIN';
        const costs = [F(2), F(3)];
        const constraints = [
            { coeffs: [F(1), F(1)], sign: '>=', rhs: F(5) },
            { coeffs: [F(1), F(2)], sign: '=', rhs: F(6) }
        ];

        const dual = buildDualProblemFromPrimal(sense, costs, constraints);

        // Dual canonical costs for Simplex (with y2+ and y2- for free variable):
        expect(dual.dualSense).toBe('MAX');
        expect(dual.dualCosts.map(c => c.toTex())).toEqual(['5', '6', '-6']);
        
        // y1 >= 0 (from >= in MIN), y2 is free/unrestricted (from =)
        expect(dual.dualVarSigns[0]).toBe('>= 0');
        expect(dual.dualVarSigns[1]).toBe('\\text{libre}');

        // Constraints in dual for MIN:
        // y1 + y2 <= 2
        // y1 + 2y2 <= 3
        expect(dual.dualConstraints[0].sign).toBe('<=');
        expect(dual.dualConstraints[0].rhs.toTex()).toBe('2');
        expect(dual.dualConstraints[1].sign).toBe('<=');
        expect(dual.dualConstraints[1].rhs.toTex()).toBe('3');
    });

    it('satisfies strong duality: Primal Optimal Z equals Dual Optimal W', () => {
        const sense = 'MAX';
        const costs = [F(3), F(5)];
        const constraints = [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ];

        const primalSolved = solveSimplexWithHistory(sense, costs, constraints);
        const dualSolved = solveDual(primalSolved);

        expect(dualSolved.W.toTex()).toBe(primalSolved.Z.toTex());
        expect(dualSolved.W.toTex()).toBe('21');
    });
});
