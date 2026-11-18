import { Fraction, F } from './math.js';
import { solveSimplexWithHistory } from './simplex.js';

export function buildDualProblemFromPrimal(sense, c, constraints) {
    const isPrimalMax = (sense === 'MAX');
    const dualSense = isPrimalMax ? 'MIN' : 'MAX';
    const dualFunc = 'W';
    const n = c.length; // number of dual constraints

    const parsedCosts = c.map(val => (val instanceof Fraction) ? val : F(val));
    const parsedConstraints = constraints.map(r => ({
        coeffs: r.coeffs.map(val => (val instanceof Fraction) ? val : F(val)),
        sign: r.sign || '<=',
        rhs: (r.rhs instanceof Fraction) ? r.rhs : F(r.rhs)
    }));

    // Convert primal constraints to canonical form (Dual Simétrico de Cátedra)
    // MAX primal -> canonical is <=
    // MIN primal -> canonical is >=
    const canonicalRows = [];
    const dualVarSigns = [];

    parsedConstraints.forEach((r, idx) => {
        if (isPrimalMax) {
            if (r.sign === '>=') {
                canonicalRows.push({
                    coeffs: r.coeffs.map(x => x.neg()),
                    sign: '<=',
                    rhs: r.rhs.neg(),
                    label: `y_${idx + 1}`
                });
                dualVarSigns.push('>= 0');
            } else if (r.sign === '=') {
                canonicalRows.push({
                    coeffs: [...r.coeffs],
                    sign: '<=',
                    rhs: r.rhs,
                    label: `y_{${idx + 1}}^+`
                });
                canonicalRows.push({
                    coeffs: r.coeffs.map(x => x.neg()),
                    sign: '<=',
                    rhs: r.rhs.neg(),
                    label: `y_{${idx + 1}}^-`
                });
                dualVarSigns.push('\\text{libre}');
            } else {
                canonicalRows.push({
                    coeffs: [...r.coeffs],
                    sign: '<=',
                    rhs: r.rhs,
                    label: `y_${idx + 1}`
                });
                dualVarSigns.push('>= 0');
            }
        } else {
            // MIN primal: canonical is >=
            if (r.sign === '<=') {
                canonicalRows.push({
                    coeffs: r.coeffs.map(x => x.neg()),
                    sign: '>=',
                    rhs: r.rhs.neg(),
                    label: `y_${idx + 1}`
                });
                dualVarSigns.push('>= 0');
            } else if (r.sign === '=') {
                canonicalRows.push({
                    coeffs: [...r.coeffs],
                    sign: '>=',
                    rhs: r.rhs,
                    label: `y_{${idx + 1}}^+`
                });
                canonicalRows.push({
                    coeffs: r.coeffs.map(x => x.neg()),
                    sign: '>=',
                    rhs: r.rhs.neg(),
                    label: `y_{${idx + 1}}^-`
                });
                dualVarSigns.push('\\text{libre}');
            } else {
                canonicalRows.push({
                    coeffs: [...r.coeffs],
                    sign: '>=',
                    rhs: r.rhs,
                    label: `y_${idx + 1}`
                });
                dualVarSigns.push('>= 0');
            }
        }
    });

    const mDual = canonicalRows.length;
    const dualCosts = canonicalRows.map(r => r.rhs);
    const dualSign = isPrimalMax ? '>=' : '<=';

    const dualConstraints = [];
    for (let j = 0; j < n; j++) {
        const coeffs = [];
        for (let i = 0; i < mDual; i++) {
            coeffs.push(canonicalRows[i].coeffs[j]);
        }
        dualConstraints.push({
            coeffs: coeffs,
            sign: dualSign,
            rhs: parsedCosts[j]
        });
    }

    return {
        dualSense,
        dualFunc,
        dualCosts,
        dualConstraints,
        dualVarSigns,
        primalSense: sense,
        primalC: parsedCosts,
        canonicalRows
    };
}

export function getDualVarCost(dualVarName, origResources) {
    if (!origResources || origResources.length === 0) return F(0);
    const m = origResources.length;
    const match = String(dualVarName).match(/y_?\{?(\d+)\}?/);
    if (match) {
        const k = parseInt(match[1], 10);
        if (k >= 1 && k <= m) {
            return origResources[k - 1];
        }
    }
    return F(0);
}

// Read Dual Tableau from optimal Primal data
export function solveDual(data) {
    if (!data) return null;
    if (!data.base && data.eqCoeffs) {
        try {
            const nVars = data.eqCoeffs[0].coeffs.length;
            const solved = solveSimplexWithHistory(
                data.sense,
                (data.origCosts || []).slice(0, nVars),
                data.eqCoeffs.map(r => ({ coeffs: r.coeffs, sign: r.sign, rhs: r.rhs }))
            );
            data = Object.assign({}, data, solved);
        } catch (e) { }
    }
    if (!data.base) {
        return {
            dualVarNames: data.dualVarNames || [],
            dualBase: [],
            dualNB: [],
            matrixRows: [],
            zj_cj: [],
            W: data.Z || F(0)
        };
    }

    const isMaxToMin = (data.sense === 'MAX');
    const primalNB = [];
    data.varNames.forEach((v, idx) => {
        if (v.includes('\\mu') || v.includes('mu_')) return;
        const inBase = data.base.some(b => b.var.trim().toLowerCase() === v.trim().toLowerCase());
        if (!inBase) {
            primalNB.push({
                name: v,
                idx: idx,
                dualName: data.dualVarNames[idx] || ('y' + (idx + 1)),
                zj_cj: data.zj_cj[idx] || F(0)
            });
        }
    });

    const dualBase = [];
    primalNB.forEach(nb => {
        const cost = getDualVarCost(nb.dualName, data.origResources);
        dualBase.push({
            dualVar: nb.dualName,
            primalNBVar: nb.name,
            primalNBIdx: nb.idx,
            B: isMaxToMin ? nb.zj_cj : nb.zj_cj.neg(),
            ck: cost
        });
    });

    const dualNB = [];
    data.base.forEach((bRow, rIdx) => {
        const varIdx = data.varNames.findIndex(v => v.trim().toLowerCase() === bRow.var.trim().toLowerCase());
        dualNB.push({
            dualVar: data.dualVarNames[varIdx] || ('y_nb_' + rIdx),
            primalBVar: bRow.var,
            primalRowIdx: rIdx,
            primalBVal: bRow.B
        });
    });

    const sortedDualVarNames = [...data.dualVarNames].sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });

    const dualMatrixRows = [];
    dualBase.forEach(db => {
        const row = [];
        sortedDualVarNames.forEach(dvName => {
            const matchB = dualBase.find(d => d.dualVar === dvName);
            if (matchB) {
                row.push(matchB.dualVar === db.dualVar ? F(1) : F(0));
            } else {
                const dnb = dualNB.find(d => d.dualVar === dvName);
                if (dnb) {
                    const primalVal = data.base[dnb.primalRowIdx].row[db.primalNBIdx] || F(0);
                    row.push(primalVal.neg());
                } else {
                    row.push(F(0));
                }
            }
        });
        dualMatrixRows.push(row);
    });

    const dualZjCj = [];
    sortedDualVarNames.forEach(dvName => {
        const isB = dualBase.some(d => d.dualVar === dvName);
        if (isB) {
            dualZjCj.push(F(0));
        } else {
            const dnb = dualNB.find(d => d.dualVar === dvName);
            if (dnb) {
                dualZjCj.push(isMaxToMin ? dnb.primalBVal.neg() : dnb.primalBVal);
            } else {
                dualZjCj.push(F(0));
            }
        }
    });

    return {
        dualVarNames: sortedDualVarNames,
        dualBase,
        dualNB,
        matrixRows: dualMatrixRows,
        zj_cj: dualZjCj,
        W: data.Z
    };
}
