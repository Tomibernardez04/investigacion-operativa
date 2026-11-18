import { describe, it, expect } from 'vitest';
import { Fraction, F, BigM } from '../math.js';

describe('Fraction - Exact Rational Arithmetic', () => {
    it('initializes from integers, strings, and decimals', () => {
        expect(F(5).toTex()).toBe('5');
        expect(F(6, 8).toTex()).toBe('3/4');
        expect(new Fraction('3/4').toTex()).toBe('3/4');
        expect(new Fraction('0.5').toTex()).toBe('1/2');
        expect(new Fraction('-2/4').toTex()).toBe('-1/2');
        expect(new Fraction(0).isZero()).toBe(true);
    });

    it('performs basic arithmetic correctly without floating point errors', () => {
        const a = F(1, 3);
        const b = F(1, 6);

        expect(a.add(b).toTex()).toBe('1/2');
        expect(a.sub(b).toTex()).toBe('1/6');
        expect(a.mul(b).toTex()).toBe('1/18');
        expect(a.div(b).toTex()).toBe('2');
        expect(a.neg().toTex()).toBe('-1/3');
        expect(a.abs().toTex()).toBe('1/3');
    });

    it('handles comparisons properly', () => {
        expect(F(3, 4).gt(F(1, 2))).toBe(true);
        expect(F(1, 4).lt(F(1, 2))).toBe(true);
        expect(F(2, 4).equals(F(1, 2))).toBe(true);
        expect(F(1, 2).gte(F(1, 2))).toBe(true);
        expect(F(1, 2).lte(F(3, 4))).toBe(true);
    });

    it('handles edge cases: division by zero fallback, negative denominators', () => {
        const divZero = new Fraction(5, 0);
        expect(divZero.d).toBe(1); // Fallback to 1 to avoid NaN crashes
        const negDen = new Fraction(3, -4);
        expect(negDen.n).toBe(-3);
        expect(negDen.d).toBe(4);
    });
});

describe('BigM - Big-M Method Arithmetic', () => {
    it('initializes with real and M parts', () => {
        const val = new BigM(F(5), F(2)); // 5 + 2M
        expect(val.p.toTex()).toBe('5');
        expect(val.q.toTex()).toBe('2');
        expect(val.toTex()).toBe('2M + 5');
    });

    it('formats pure real, pure M, and mixed values properly', () => {
        expect(new BigM(F(0), F(0)).toTex()).toBe('0');
        expect(new BigM(F(7), F(0)).toTex()).toBe('7');
        expect(new BigM(F(0), F(1)).toTex()).toBe('M');
        expect(new BigM(F(0), F(-1)).toTex()).toBe('-M');
        expect(new BigM(F(3), F(2)).toTex()).toBe('2M + 3');
        expect(new BigM(F(-4), F(1)).toTex()).toBe('M - 4');
    });

    it('performs additions and subtractions', () => {
        const a = new BigM(F(3), F(1)); // 3 + M
        const b = new BigM(F(2), F(2)); // 2 + 2M

        const sum = a.add(b);
        expect(sum.p.toTex()).toBe('5');
        expect(sum.q.toTex()).toBe('3');

        const diff = a.sub(b); // (3+M) - (2+2M) = 1 - M
        expect(diff.p.toTex()).toBe('1');
        expect(diff.q.toTex()).toBe('-1');
    });

    it('evaluates inequality where M dominates', () => {
        const hugeReal = new BigM(F(10000), F(0));
        const smallM = new BigM(F(0), F(1)); // 1M > 10000
        expect(smallM.gt(hugeReal)).toBe(true);
        expect(hugeReal.lt(smallM)).toBe(true);

        const negativeM = new BigM(F(500), F(-1)); // -M + 500 < 0
        expect(negativeM.lt(new BigM(F(0), F(0)))).toBe(true);
    });
});
