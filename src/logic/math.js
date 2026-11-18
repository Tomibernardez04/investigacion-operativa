// Exact fraction class for lossless Simplex math
export class Fraction {
    constructor(num, den = 1) {
        if (num && typeof num === 'object' && num.n !== undefined && num.d !== undefined) {
            den = num.d;
            num = num.n;
        } else if (typeof num === 'string') {
            num = num.trim();
            if (num.includes('/')) {
                const parts = num.split('/');
                num = parseInt(parts[0], 10);
                den = parseInt(parts[1], 10);
            } else if (num.includes('.')) {
                const val = parseFloat(num);
                const str = val.toString();
                const decimals = str.includes('.') ? str.split('.')[1].length : 0;
                den = Math.pow(10, decimals);
                num = Math.round(val * den);
            } else {
                num = parseInt(num, 10);
                den = 1;
            }
        }
        if (isNaN(num)) num = 0;
        if (isNaN(den) || den === 0) den = 1;
        if (den < 0) { num = -num; den = -den; }
        const g = this.gcd(Math.abs(num), Math.abs(den));
        this.n = num / g;
        this.d = den / g;
    }

    gcd(a, b) { return b === 0 ? a : this.gcd(b, a % b); }
    add(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
    }
    sub(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
    }
    mul(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return new Fraction(this.n * o.n, this.d * o.d);
    }
    div(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return new Fraction(this.n * o.d, this.d * o.n);
    }
    neg() { return new Fraction(-this.n, this.d); }
    toNumber() { return this.d !== 0 ? (this.n / this.d) : 0; }
    toTex() { return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`; }
    toString() { return this.toTex(); }
    equals(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return this.n === o.n && this.d === o.d;
    }
    isZero() { return this.n === 0; }
    gt(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return this.n * o.d > o.n * this.d;
    }
    lt(other) {
        const o = (other instanceof Fraction) ? other : new Fraction(other);
        return this.n * o.d < o.n * this.d;
    }
    gte(other) { return !this.lt(other); }
    lte(other) { return !this.gt(other); }
    abs() { return new Fraction(Math.abs(this.n), this.d); }
}

export function F(n, d = 1) { return new Fraction(n, d); }

// BigM class: represents values of the form p + q * M
export class BigM {
    constructor(p = F(0), q = F(0)) {
        this.p = (p instanceof Fraction) ? p : F(p);
        this.q = (q instanceof Fraction) ? q : F(q);
    }
    add(other) {
        const o = (other instanceof BigM) ? other : new BigM(other, F(0));
        return new BigM(this.p.add(o.p), this.q.add(o.q));
    }
    sub(other) {
        const o = (other instanceof BigM) ? other : new BigM(other, F(0));
        return new BigM(this.p.sub(o.p), this.q.sub(o.q));
    }
    mul(frac) {
        const f = (frac && frac.n !== undefined && frac.d !== undefined) ? frac : F(frac);
        return new BigM(this.p.mul(f), this.q.mul(f));
    }
    neg() {
        return new BigM(this.p.neg(), this.q.neg());
    }
    isZero() {
        return this.p.isZero() && this.q.isZero();
    }
    gt(other) {
        const o = (other instanceof BigM) ? other : new BigM(other, F(0));
        const diff = this.sub(o);
        if (diff.q.gt(F(0))) return true;
        if (diff.q.lt(F(0))) return false;
        return diff.p.gt(F(0));
    }
    lt(other) {
        const o = (other instanceof BigM) ? other : new BigM(other, F(0));
        const diff = this.sub(o);
        if (diff.q.lt(F(0))) return true;
        if (diff.q.gt(F(0))) return false;
        return diff.p.lt(F(0));
    }
    gte(other) { return !this.lt(other); }
    lte(other) { return !this.gt(other); }
    equals(other) {
        const o = (other instanceof BigM) ? other : new BigM(other, F(0));
        return this.p.equals(o.p) && this.q.equals(o.q);
    }
    toTex() {
        const pZero = this.p.isZero();
        const qZero = this.q.isZero();
        if (qZero && pZero) return '0';
        if (qZero) return this.p.toTex();

        let qStr = '';
        if (this.q.equals(F(1))) qStr = 'M';
        else if (this.q.equals(F(-1))) qStr = '-M';
        else qStr = `${this.q.toTex()}M`;

        if (pZero) return qStr;

        let pSign = '+';
        let pAbs = this.p;
        if (this.p.lt(F(0))) {
            pSign = '-';
            pAbs = this.p.neg();
        }
        return `${qStr} ${pSign} ${pAbs.toTex()}`;
    }
    toString() { return this.toTex(); }
}

export function toFloat(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (val instanceof BigM) return val.p.toNumber();
    if (val instanceof Fraction) return val.toNumber();
    if (val && typeof val === 'object' && val.n !== undefined && val.d !== undefined) {
        return val.d !== 0 ? (val.n / val.d) : 0;
    }
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
}

export function formatVarMath(name) {
    if (!name) return '';
    let s = String(name).trim();
    if (s.startsWith('$') && s.endsWith('$')) {
        s = s.slice(1, -1).trim();
    }
    s = s.replace(/\\?mu_?\{?([a-zA-Z0-9]+)\}?/gi, '\\mu_{$1}');
    s = s.replace(/\\?lambda_?\{?([a-zA-Z0-9]+)\}?/gi, '\\lambda_{$1}');
    s = s.replace(/^([xy])_?\{?([a-zA-Z0-9]+)\}?$/i, '$1_{$2}');
    return `$${s}$`;
}
