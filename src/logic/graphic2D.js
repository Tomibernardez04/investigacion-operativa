import { toFloat } from './math.js';

export function getCleanScale(maxVal) {
    if (maxVal <= 0 || !isFinite(maxVal)) return { max: 10, step: 2 };
    
    const roughStep = (maxVal * 1.18) / 5;
    const exp = Math.floor(Math.log10(roughStep));
    const frac = roughStep / Math.pow(10, exp);
    
    let stepFrac;
    if (frac <= 1.2) stepFrac = 1;
    else if (frac <= 2.2) stepFrac = 2;
    else if (frac <= 3.2) stepFrac = 2.5;
    else if (frac <= 6.5) stepFrac = 5;
    else stepFrac = 10;
    
    const step = stepFrac * Math.pow(10, exp);
    let count = Math.ceil(maxVal / step);
    if (maxVal >= count * step * 0.90) {
        count++;
    }
    if (count < 3) count = 3;
    
    const bound = count * step;
    return {
        max: Number(bound.toFixed(6)),
        step: Number(step.toFixed(6))
    };
}

export function getNiceUpperBound(val) {
    return getCleanScale(val).max;
}

export function getNiceTickStep(maxVal) {
    return getCleanScale(maxVal).step;
}

export function formatTickVal(val) {
    if (Math.abs(val) >= 100000) return (val / 1000).toFixed(0) + 'k';
    if (Math.abs(val) >= 10000) return Number(val.toFixed(0));
    if (Number.isInteger(val)) return val.toString();
    return Number(val.toFixed(2)).toString();
}

export function computeOptimalBounds(constraints, trajectory, altData) {
    const isFeasible = (x, y) => {
        if (x < -1e-4 || y < -1e-4) return false;
        for (const c of constraints) {
            const a1 = toFloat(c.coeffs[0]);
            const a2 = toFloat(c.coeffs[1]);
            const b = toFloat(c.rhs);
            const lhs = a1 * x + a2 * y;
            if (c.sign === '<=' && lhs > b + 1e-4) return false;
            if (c.sign === '>=' && lhs < b - 1e-4) return false;
            if (c.sign === '=' && Math.abs(lhs - b) > 1e-4) return false;
        }
        return true;
    };

    const lines = [
        { a1: 1, a2: 0, b: 0 },
        { a1: 0, a2: 1, b: 0 }
    ];
    constraints.forEach(c => {
        lines.push({
            a1: toFloat(c.coeffs[0]),
            a2: toFloat(c.coeffs[1]),
            b: toFloat(c.rhs)
        });
    });

    const feasibleX = [];
    const feasibleY = [];
    const allPositiveX = [];
    const allPositiveY = [];

    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const l1 = lines[i];
            const l2 = lines[j];
            const det = l1.a1 * l2.a2 - l1.a2 * l2.a1;
            if (Math.abs(det) > 1e-7) {
                const ix = (l1.b * l2.a2 - l1.a2 * l2.b) / det;
                const iy = (l1.a1 * l2.b - l1.b * l2.a1) / det;
                const cleanX = Math.abs(ix) < 1e-6 ? 0 : ix;
                const cleanY = Math.abs(iy) < 1e-6 ? 0 : iy;
                if (cleanX >= 0 && cleanY >= 0 && isFinite(cleanX) && isFinite(cleanY)) {
                    allPositiveX.push(cleanX);
                    allPositiveY.push(cleanY);
                    if (isFeasible(cleanX, cleanY)) {
                        feasibleX.push(cleanX);
                        feasibleY.push(cleanY);
                    }
                }
            }
        }
    }

    if (trajectory && trajectory.length > 0) {
        trajectory.forEach(pt => {
            const px = toFloat(pt.x);
            const py = toFloat(pt.y);
            if (px >= 0 && isFinite(px)) {
                feasibleX.push(px);
                allPositiveX.push(px);
            }
            if (py >= 0 && isFinite(py)) {
                feasibleY.push(py);
                allPositiveY.push(py);
            }
        });
    }

    if (altData && altData.hasAlternatives) {
        const v1x = toFloat(altData.sol1.vector[0]);
        const v1y = toFloat(altData.sol1.vector[1]);
        const v2x = toFloat(altData.sol2.vector[0]);
        const v2y = toFloat(altData.sol2.vector[1]);
        [v1x, v2x].forEach(x => { if (x >= 0 && isFinite(x)) feasibleX.push(x); });
        [v1y, v2y].forEach(y => { if (y >= 0 && isFinite(y)) feasibleY.push(y); });
    }

    let targetX = 2;
    let targetY = 2;

    if (feasibleX.length > 0 && feasibleY.length > 0) {
        targetX = Math.max(0.5, ...feasibleX);
        targetY = Math.max(0.5, ...feasibleY);
    } else if (allPositiveX.length > 0 && allPositiveY.length > 0) {
        allPositiveX.sort((a,b) => a - b);
        allPositiveY.sort((a,b) => a - b);
        const pX = allPositiveX[Math.floor(allPositiveX.length * 0.85)] || allPositiveX[0];
        const pY = allPositiveY[Math.floor(allPositiveY.length * 0.85)] || allPositiveY[0];
        targetX = Math.max(0.5, pX);
        targetY = Math.max(0.5, pY);
    }

    const scaleX = getCleanScale(targetX);
    const scaleY = getCleanScale(targetY);

    return {
        xMax: scaleX.max,
        yMax: scaleY.max,
        xStep: scaleX.step,
        yStep: scaleY.step
    };
}

export function computeFeasiblePolygon(constraints, xMax, yMax) {
    function clipPoly(poly, a, b, c, isLe = true) {
        function inside(p) {
            const val = a * p[0] + b * p[1];
            return isLe ? (val <= c + 1e-5) : (val >= c - 1e-5);
        }
        function intersect(p1, p2) {
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const denom = a * dx + b * dy;
            if (Math.abs(denom) < 1e-11) return p1;
            const t = (c - a * p1[0] - b * p1[1]) / denom;
            return [p1[0] + t * dx, p1[1] + t * dy];
        }
        if (!poly || poly.length === 0) return [];
        const out = [];
        let p1 = poly[poly.length - 1];
        for (let p2 of poly) {
            if (inside(p2)) {
                if (!inside(p1)) out.push(intersect(p1, p2));
                out.push(p2);
            } else if (inside(p1)) {
                out.push(intersect(p1, p2));
            }
            p1 = p2;
        }
        return out;
    }

    let poly = [[0, 0], [xMax, 0], [xMax, yMax], [0, yMax]];
    poly = clipPoly(poly, 1, 0, 0, false);
    poly = clipPoly(poly, 0, 1, 0, false);

    for (let c of constraints) {
        const a1 = toFloat(c.coeffs[0]);
        const a2 = toFloat(c.coeffs[1]);
        const b = toFloat(c.rhs);
        if (c.sign === '<=') {
            poly = clipPoly(poly, a1, a2, b, true);
        } else if (c.sign === '>=') {
            poly = clipPoly(poly, a1, a2, b, false);
        } else if (c.sign === '=') {
            poly = clipPoly(poly, a1, a2, b, true);
            poly = clipPoly(poly, a1, a2, b, false);
        }
    }

    const dedup = [];
    for (let p of poly) {
        if (!dedup.some(d => Math.hypot(d[0] - p[0], d[1] - p[1]) < 1e-2)) {
            dedup.push(p);
        }
    }
    return dedup;
}

export function getLineSegmentInBox(a1, a2, b, xMax, yMax) {
    const pts = [];
    const eps = 1e-5;
    if (Math.abs(a2) > 1e-9) {
        const y = b / a2;
        if (y >= -eps && y <= yMax + eps) pts.push([0, Math.max(0, Math.min(yMax, y))]);
        const y2 = (b - a1 * xMax) / a2;
        if (y2 >= -eps && y2 <= yMax + eps) pts.push([xMax, Math.max(0, Math.min(yMax, y2))]);
    }
    if (Math.abs(a1) > 1e-9) {
        const x = b / a1;
        if (x >= -eps && x <= xMax + eps) pts.push([Math.max(0, Math.min(xMax, x)), 0]);
        const x2 = (b - a2 * yMax) / a1;
        if (x2 >= -eps && x2 <= xMax + eps) pts.push([Math.max(0, Math.min(xMax, x2)), yMax]);
    }
    const dedup = [];
    for (let p of pts) {
        if (!dedup.some(d => Math.hypot(d[0] - p[0], d[1] - p[1]) < 1e-3)) {
            dedup.push(p);
        }
    }
    return dedup.length >= 2 ? [dedup[0], dedup[1]] : null;
}
