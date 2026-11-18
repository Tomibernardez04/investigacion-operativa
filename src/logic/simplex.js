import { Fraction, F, BigM, formatVarMath, toTexVar } from './math.js';

// SIMPLEX SOLVER ENGINE WITH BIG-M METHOD & ITERATION HISTORY
export function solveSimplexWithHistory(objSense, objCoeffs, constraints, varPrefix = 'x', funcName = 'Z') {
    const n = objCoeffs.length;
    const m = constraints.length;
    const isMin = (objSense === 'MIN');

    const constrs = constraints.map(c => {
        const rhs = (c.rhs instanceof Fraction) ? c.rhs : F(c.rhs);
        const coeffs = c.coeffs.map(x => (x instanceof Fraction) ? x : F(x));
        if (rhs.lt(F(0))) {
            let flippedSign = c.sign === '<=' ? '>=' : c.sign === '>=' ? '<=' : '=';
            return {
                coeffs: coeffs.map(x => x.neg()),
                sign: flippedSign,
                rhs: rhs.neg()
            };
        }
        return { coeffs, sign: c.sign || '<=', rhs };
    });

    const parsedCosts = objCoeffs.map(c => (c instanceof Fraction) ? c : F(c));

    const varNames = [];
    const dualVarNames = [];
    const costs = [];

    // Decision variables
    for (let j = 0; j < n; j++) {
        varNames.push(`${varPrefix}${j + 1}`);
        dualVarNames.push(`y${m + j + 1}`);
        costs.push(new BigM(parsedCosts[j], F(0)));
    }

    const base = [];
    const constraintCols = [];
    const artCols = [];

    constrs.forEach((c, i) => {
        const varIdxNum = n + i + 1;
        if (c.sign === '<=') {
            const sName = `${varPrefix}${varIdxNum}`;
            varNames.push(sName);
            const colIdx = varNames.length - 1;
            dualVarNames.push(`y${i + 1}`);
            costs.push(new BigM(F(0), F(0)));
            constraintCols.push({ row: i, col: colIdx, val: F(1), name: sName });
            base.push(colIdx);
        } else if (c.sign === '>=') {
            const eName = `${varPrefix}${varIdxNum}`;
            varNames.push(eName);
            const eColIdx = varNames.length - 1;
            dualVarNames.push(`y${i + 1}`);
            costs.push(new BigM(F(0), F(0)));
            constraintCols.push({ row: i, col: eColIdx, val: F(-1), name: eName });

            const uName = `\\mu_${i + 1}`;
            varNames.push(uName);
            const uColIdx = varNames.length - 1;
            dualVarNames.push('');
            const artCost = isMin ? new BigM(F(0), F(1)) : new BigM(F(0), F(-1));
            costs.push(artCost);
            artCols.push({ row: i, col: uColIdx, name: uName });
            base.push(uColIdx);
        } else if (c.sign === '=') {
            const lName = `\\lambda_${i + 1}`;
            varNames.push(lName);
            const lColIdx = varNames.length - 1;
            dualVarNames.push(`y${i + 1}`);
            const artCost = isMin ? new BigM(F(0), F(1)) : new BigM(F(0), F(-1));
            costs.push(artCost);
            artCols.push({ row: i, col: lColIdx, name: lName, isLambda: true });
            base.push(lColIdx);
        }
    });

    const totalCols = varNames.length;
    let A = [];
    for (let i = 0; i < m; i++) {
        let row = new Array(totalCols + 1).fill(F(0));
        for (let j = 0; j < n; j++) row[j] = constrs[i].coeffs[j];
        constraintCols.forEach(cc => {
            if (cc.row === i) row[cc.col] = cc.val;
        });
        artCols.forEach(ac => {
            if (ac.row === i) row[ac.col] = F(1);
        });
        row[totalCols] = constrs[i].rhs;
        A.push(row);
    }

    // Build Standard Form Metadata
    const stdSteps = [];
    const stdEquations = [];
    constrs.forEach((c, i) => {
        const origC = constraints[i];
        let origRhs = (origC.rhs instanceof Fraction) ? origC.rhs : F(origC.rhs);
        let signChangeNote = '';
        if (origRhs.lt(F(0))) {
            signChangeNote = `⚠️ <b>Ajuste por término negativo:</b> $b_{${i + 1}} = ${origRhs.toTex()} < 0$. Se multiplicó por $-1$, invirtiéndose la desigualdad a «$${c.sign}$» con $b_{${i + 1}} = ${c.rhs.toTex()}$.<br>`;
        }

        let origLhs = [];
        for (let j = 0; j < n; j++) {
            let coef = c.coeffs[j];
            if (coef.isZero()) continue;
            let cTex = (coef.equals(F(1))) ? '' : (coef.equals(F(-1)) ? '-' : coef.toTex());
            let s = '+';
            if (coef.lt(F(0))) {
                s = '-';
                cTex = coef.neg().equals(F(1)) ? '' : coef.neg().toTex();
            }
            if (origLhs.length === 0) {
                origLhs.push((s === '-' ? '-' : '') + cTex + `x_{${j + 1}}`);
            } else {
                origLhs.push(`${s} ${cTex}x_{${j + 1}}`);
            }
        }
        let lhsStr = origLhs.length > 0 ? origLhs.join(' ') : '0';

        const varIdxNum = n + i + 1;
        let explanation = '';
        let stdEqTex = '';
        if (c.sign === '<=') {
            explanation = `${signChangeNote}• <b>Restricción de tipo $\\le$:</b> Se suma la variable de holgura (slack) <b>$x_{${varIdxNum}} \\ge 0$</b> (costo $c = 0$). Aporta el vector canónico unitario e ingresa a la <b>base inicial</b>.`;
            stdEqTex = `${lhsStr} + x_{${varIdxNum}} = ${c.rhs.toTex()}`;
        } else if (c.sign === '>=') {
            explanation = `${signChangeNote}• <b>Restricción de tipo $\\ge$:</b> Se resta la variable de exceso (surplus) <b>$-x_{${varIdxNum}} \\ge 0$</b> (costo $0$) para igualar, y se suma la variable artificial <b>$+\\mu_{${i + 1}} \\ge 0$</b> (penalizada en $Z$ con ${isMin ? '+M' : '-M'}). La variable artificial $\\mu_{${i + 1}}$ ingresa a la <b>base inicial</b> con costo $c_k = ${isMin ? '+M' : '-M'}$.`;
            stdEqTex = `${lhsStr} - x_{${varIdxNum}} + \\mu_{${i + 1}} = ${c.rhs.toTex()}`;
        } else if (c.sign === '=') {
            explanation = `${signChangeNote}• <b>Restricción de igualdad ($=$):</b> No requiere variable de holgura ni de exceso. Se suma la variable artificial / lambda <b>$+\\lambda_{${i + 1}} \\ge 0$</b> para proveer el vector canónico de la <b>base inicial</b> con costo $c_k = ${isMin ? '+M' : '-M'}$.`;
            stdEqTex = `${lhsStr} + \\lambda_{${i + 1}} = ${c.rhs.toTex()}`;
        }

        stdSteps.push({ rowIdx: i + 1, explanation, stdEqTex });
        stdEquations.push(stdEqTex);
    });

    let objStandardTex = isMin ? `\\text{Min } ${funcName} = ` : `\\text{Max } ${funcName} = `;
    let objTerms = [];
    for (let j = 0; j < n; j++) {
        let coef = parsedCosts[j];
        if (coef.isZero()) continue;
        let cTex = (coef.equals(F(1))) ? '' : (coef.equals(F(-1)) ? '-' : coef.toTex());
        let s = '+';
        if (coef.lt(F(0))) {
            s = '-';
            cTex = coef.neg().equals(F(1)) ? '' : coef.neg().toTex();
        }
        if (objTerms.length === 0) {
            objTerms.push((s === '-' ? '-' : '') + cTex + `x_{${j + 1}}`);
        } else {
            objTerms.push(`${s} ${cTex}x_{${j + 1}}`);
        }
    }
    objStandardTex += (objTerms.length > 0 ? objTerms.join(' ') : '0');
    constraintCols.forEach(cc => {
        objStandardTex += ` + 0 ${toTexVar(cc.name)}`;
    });
    if (artCols.length > 0) {
        const artSign = isMin ? '+ M' : '- M';
        artCols.forEach(ac => {
            objStandardTex += ` ${artSign} ${toTexVar(ac.name)}`;
        });
    }

    let nonNegList = [];
    for (let j = 1; j <= n; j++) nonNegList.push(`x_{${j}}`);
    constraintCols.forEach(cc => nonNegList.push(toTexVar(cc.name)));
    artCols.forEach(ac => {
        nonNegList.push(toTexVar(ac.name));
    });
    let nonNegTex = nonNegList.join(', ') + ' \\ge 0';
    const initialBaseNames = base.map(bIdx => varNames[bIdx]);

    const standardForm = {
        steps: stdSteps,
        objTex: objStandardTex,
        equations: stdEquations,
        nonNegTex,
        initialBase: initialBaseNames,
        hasArtificials: artCols.length > 0,
        artCostText: isMin ? '+M' : '-M',
        artSignText: isMin ? '+M' : '-M'
    };

    function snapshotTableau(currentBase, currentA) {
        const rows = [];
        for (let i = 0; i < m; i++) {
            rows.push({
                var: varNames[currentBase[i]],
                colIdx: currentBase[i],
                ck: costs[currentBase[i]],
                B: currentA[i][totalCols],
                row: currentA[i].slice(0, totalCols)
            });
        }
        const zj_cj = [];
        let Z = new BigM(F(0), F(0));
        for (let j = 0; j < totalCols; j++) {
            let zj = new BigM(F(0), F(0));
            for (let i = 0; i < m; i++) {
                const cost = costs[currentBase[i]];
                zj = zj.add(cost.mul(currentA[i][j]));
            }
            const costJ = costs[j];
            zj_cj.push(zj.sub(costJ));
        }
        for (let i = 0; i < m; i++) {
            const cost = costs[currentBase[i]];
            Z = Z.add(cost.mul(currentA[i][totalCols]));
        }
        const phaseName = artCols.length > 0 ? 'Método Simplex (Gran M)' : 'Método Simplex';
        return { phaseName, cols: [...varNames], costs: [...costs], baseRows: rows, zj_cj, Z };
    }

    const iterations = [];
    let isUnbounded = false;

    for (let it = 0; it < 50; it++) {
        const snap = snapshotTableau(base, A);

        let inCol = -1;
        let targetVal = null;

        if (!isMin) {
            // MAX: most negative enters
            let minVal = new BigM(F(0), F(0));
            for (let j = 0; j < totalCols; j++) {
                if (snap.zj_cj[j].lt(minVal)) {
                    minVal = snap.zj_cj[j];
                    inCol = j;
                }
            }
            targetVal = minVal;
            if (inCol === -1 || minVal.gte(new BigM(F(0), F(0)))) {
                // Optimal condition reached for MAX
                // Check for alternative solutions (non-basic variable with zj - cj = 0 and a_ij > 0)
                let altCandidateCol = -1;
                let altOutRow = -1;
                let altMinRatio = null;
                let altRatios = [];

                for (let j = 0; j < totalCols; j++) {
                    const inBase = base.includes(j);
                    if (!inBase && !artCols.some(ac => ac.col === j) && snap.zj_cj[j].isZero()) {
                        let candidateRatios = [];
                        let candidateMinRatio = null;
                        let candidateOutRow = -1;
                        for (let i = 0; i < m; i++) {
                            if (A[i][j].gt(F(0))) {
                                let ratio = A[i][totalCols].div(A[i][j]);
                                candidateRatios.push({ row: i, ratio });
                                if (candidateMinRatio === null || ratio.lt(candidateMinRatio)) {
                                    candidateMinRatio = ratio;
                                    candidateOutRow = i;
                                }
                            } else {
                                candidateRatios.push({ row: i, ratio: null });
                            }
                        }
                        if (candidateOutRow !== -1) {
                            altCandidateCol = j;
                            altOutRow = candidateOutRow;
                            altMinRatio = candidateMinRatio;
                            altRatios = candidateRatios;
                            break;
                        }
                    }
                }

                if (altCandidateCol !== -1) {
                    const altInVar = varNames[altCandidateCol];
                    const altOutVar = varNames[base[altOutRow]];

                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: false,
                        isAlternativeOptimal1: true,
                        snap: snap,
                        inCol: altCandidateCol,
                        inVar: altInVar,
                        outRow: altOutRow,
                        outVar: altOutVar,
                        pivotVal: A[altOutRow][altCandidateCol],
                        ratios: altRatios,
                        altCandidateCol: altCandidateCol,
                        altCandidateVar: altInVar,
                        explanation: `<b>¡Condición de optimalidad alcanzada (Solución Óptima 1)!</b> Todos los indicadores netos $z_j - c_j \\ge 0$.<br>` +
                            `⚠️ <b>Detección de Solución Alternativa:</b> La variable no básica <b>${formatVarMath(altInVar)}</b> tiene costo reducido <b>$0^*$</b> ($z_j - c_j = 0$) con coeficientes técnicos positivos ($a_{i,j} > 0$).<br>` +
                            `• Al ingresar a la base <b>${formatVarMath(altInVar)}</b> en reemplazo de <b>${formatVarMath(altOutVar)}</b> (ratio mínimo $\\theta = ${altMinRatio.toTex()}$), se obtiene una <b>segunda solución básica factible óptima</b> con el mismo valor funcional $Z = ${snap.Z.toTex()}.<br>` +
                            `👉 <i>Hacé clic en <b>"Siguiente ➔"</b> para visualizar la Tabla Óptima Alternativa 2 con la nueva base.</i>`
                    });

                    // Perform pivot to Table 2
                    let pivot = A[altOutRow][altCandidateCol];
                    A[altOutRow] = A[altOutRow].map(x => x.div(pivot));
                    for (let i = 0; i < m; i++) {
                        if (i !== altOutRow) {
                            let factor = A[i][altCandidateCol];
                            A[i] = A[i].map((val, k) => val.sub(factor.mul(A[altOutRow][k])));
                        }
                    }
                    const returningCol = base[altOutRow];
                    base[altOutRow] = altCandidateCol;

                    const snap2 = snapshotTableau(base, A);

                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: true,
                        isAlternativeOptimal2: true,
                        snap: snap2,
                        altReturningCol: returningCol,
                        altReturningVar: varNames[returningCol],
                        explanation: `<b>¡Solución Óptima Alternativa 2 Alcanzada!</b><br>` +
                            `• Ingresó la variable <b>${formatVarMath(altInVar)}</b> a la base y salió <b>${formatVarMath(altOutVar)}</b>.<br>` +
                            `• El valor del funcional permanece óptimo e idéntico: <b>$Z = ${snap2.Z.toTex()}$</b>.<br>` +
                            `• En la fila de indicadores netos, la variable saliente <b>${formatVarMath(varNames[returningCol])}</b> ahora presenta indicador <b>$0^*$</b> (pivoteo de retorno hacia la Solución 1).<br>` +
                            `👈 <i>Hacé clic en <b>"⬅ Anterior"</b> para comparar con la Solución 1.</i>`
                    });
                } else {
                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: true,
                        snap,
                        explanation: '<b>¡Condición de optimalidad alcanzada!</b> Todos los indicadores netos $z_j - c_j \\ge 0$. Ninguna variable no básica puede ingresar para incrementar el funcional.'
                    });
                }
                break;
            }
        } else {
            // MIN: most positive enters
            let maxVal = new BigM(F(0), F(0));
            for (let j = 0; j < totalCols; j++) {
                if (snap.zj_cj[j].gt(maxVal)) {
                    maxVal = snap.zj_cj[j];
                    inCol = j;
                }
            }
            targetVal = maxVal;
            if (inCol === -1 || maxVal.lte(new BigM(F(0), F(0)))) {
                // Optimal condition reached for MIN
                let altCandidateCol = -1;
                let altOutRow = -1;
                let altMinRatio = null;
                let altRatios = [];

                for (let j = 0; j < totalCols; j++) {
                    const inBase = base.includes(j);
                    if (!inBase && !artCols.some(ac => ac.col === j) && snap.zj_cj[j].isZero()) {
                        let candidateRatios = [];
                        let candidateMinRatio = null;
                        let candidateOutRow = -1;
                        for (let i = 0; i < m; i++) {
                            if (A[i][j].gt(F(0))) {
                                let ratio = A[i][totalCols].div(A[i][j]);
                                candidateRatios.push({ row: i, ratio });
                                if (candidateMinRatio === null || ratio.lt(candidateMinRatio)) {
                                    candidateMinRatio = ratio;
                                    candidateOutRow = i;
                                }
                            } else {
                                candidateRatios.push({ row: i, ratio: null });
                            }
                        }
                        if (candidateOutRow !== -1) {
                            altCandidateCol = j;
                            altOutRow = candidateOutRow;
                            altMinRatio = candidateMinRatio;
                            altRatios = candidateRatios;
                            break;
                        }
                    }
                }

                if (altCandidateCol !== -1) {
                    const altInVar = varNames[altCandidateCol];
                    const altOutVar = varNames[base[altOutRow]];

                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: false,
                        isAlternativeOptimal1: true,
                        snap: snap,
                        inCol: altCandidateCol,
                        inVar: altInVar,
                        outRow: altOutRow,
                        outVar: altOutVar,
                        pivotVal: A[altOutRow][altCandidateCol],
                        ratios: altRatios,
                        altCandidateCol: altCandidateCol,
                        altCandidateVar: altInVar,
                        explanation: `<b>¡Condición de optimalidad alcanzada (Solución Óptima 1)!</b> Todos los indicadores netos $z_j - c_j \\le 0$.<br>` +
                            `⚠️ <b>Detección de Solución Alternativa:</b> La variable no básica <b>${formatVarMath(altInVar)}</b> tiene costo reducido <b>$0^*$</b> ($z_j - c_j = 0$) con coeficientes técnicos positivos ($a_{i,j} > 0$).<br>` +
                            `• Al ingresar a la base <b>${formatVarMath(altInVar)}</b> en reemplazo de <b>${formatVarMath(altOutVar)}</b> (ratio mínimo $\\theta = ${altMinRatio.toTex()}$), se obtiene una <b>segunda solución básica factible óptima</b> con el mismo valor funcional $Z = ${snap.Z.toTex()}.<br>` +
                            `👉 <i>Hacé clic en <b>"Siguiente ➔"</b> para visualizar la Tabla Óptima Alternativa 2 con la nueva base.</i>`
                    });

                    let pivot = A[altOutRow][altCandidateCol];
                    A[altOutRow] = A[altOutRow].map(x => x.div(pivot));
                    for (let i = 0; i < m; i++) {
                        if (i !== altOutRow) {
                            let factor = A[i][altCandidateCol];
                            A[i] = A[i].map((val, k) => val.sub(factor.mul(A[altOutRow][k])));
                        }
                    }
                    const returningCol = base[altOutRow];
                    base[altOutRow] = altCandidateCol;

                    const snap2 = snapshotTableau(base, A);

                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: true,
                        isAlternativeOptimal2: true,
                        snap: snap2,
                        altReturningCol: returningCol,
                        altReturningVar: varNames[returningCol],
                        explanation: `<b>¡Solución Óptima Alternativa 2 Alcanzada!</b><br>` +
                            `• Ingresó la variable <b>${formatVarMath(altInVar)}</b> a la base y salió <b>${formatVarMath(altOutVar)}</b>.<br>` +
                            `• El valor del funcional permanece óptimo e idéntico: <b>$Z = ${snap2.Z.toTex()}$</b>.<br>` +
                            `• En la fila de indicadores netos, la variable saliente <b>${formatVarMath(varNames[returningCol])}</b> ahora presenta indicador <b>$0^*$</b> (pivoteo de retorno hacia la Solución 1).<br>` +
                            `👈 <i>Hacé clic en <b>"⬅ Anterior"</b> para comparar con la Solución 1.</i>`
                    });
                } else {
                    iterations.push({
                        isOptimal: true,
                        isFinalOptimal: true,
                        snap,
                        explanation: '<b>¡Condición de optimalidad alcanzada!</b> Todos los indicadores netos $z_j - c_j \\le 0$. Ninguna variable no básica puede ingresar para reducir el funcional.'
                    });
                }
                break;
            }
        }

        let outRow = -1;
        let minRatio = null;
        const ratios = [];
        let tieBreak = false;

        for (let i = 0; i < m; i++) {
            if (A[i][inCol].gt(F(0))) {
                let ratio = A[i][totalCols].div(A[i][inCol]);
                ratios.push({ row: i, ratio });
                if (minRatio === null || ratio.lt(minRatio)) {
                    minRatio = ratio;
                    outRow = i;
                    tieBreak = false;
                } else if (ratio.equals(minRatio)) {
                    tieBreak = true;
                }
            } else {
                ratios.push({ row: i, ratio: null });
            }
        }

        if (outRow === -1) {
            isUnbounded = true;
            iterations.push({
                isUnbounded: true,
                snap,
                inCol,
                inVar: varNames[inCol],
                explanation: `🚨 <b>Problema No Acotado (Poliedro Abierto):</b> La variable entrante <b>${formatVarMath(varNames[inCol])}</b> tiene todos sus coeficientes no positivos ($a_{ij} \\le 0$). Su valor puede crecer indefinidamente.`
            });
            break;
        }

        let tieMsg = tieBreak ? ' <br>⚠️ <b>Empate en ratio $\\theta$:</b> Se detectó empate entre dos o más filas. Se elige la primera fila por regla de desempate.' : '';
        const indicatorText = isMin ? `más positivo $z_j - c_j = ${targetVal.toTex()}$` : `más negativo $z_j - c_j = ${targetVal.toTex()}$`;
        iterations.push({
            isOptimal: false,
            snap,
            inCol,
            inVar: varNames[inCol],
            outRow,
            outVar: varNames[base[outRow]],
            pivotVal: A[outRow][inCol],
            ratios,
            tieBreak,
            explanation: `<b>Iteración de Pivoteo:</b><br>` +
                `• <b>Variable Entrante:</b> <b>${formatVarMath(varNames[inCol])}</b> (indicador ${indicatorText}).<br>` +
                `• <b>Variable Saliente:</b> <b>${formatVarMath(varNames[base[outRow]])}</b> con ratio mínimo $\\theta = ${minRatio.toTex()}$.${tieMsg}<br>` +
                `• <b>Elemento Pivote:</b> $a_{${outRow + 1},${inCol + 1}} = ${A[outRow][inCol].toTex()}$.`
        });

        // Pivot
        let pivot = A[outRow][inCol];
        A[outRow] = A[outRow].map(x => x.div(pivot));
        for (let i = 0; i < m; i++) {
            if (i !== outRow) {
                let factor = A[i][inCol];
                A[i] = A[i].map((val, k) => val.sub(factor.mul(A[outRow][k])));
            }
        }
        base[outRow] = inCol;
    }

    if (isUnbounded) {
        return {
            verdict: 'UNBOUNDED',
            title: 'Polígono Abierto (No Acotado)',
            badgeClass: 'unbounded',
            verdictMsg: 'El funcional objetivo puede mejorar indefinidamente ($Z \\to \\pm\\infty$). El poliedro es abierto en la dirección de la variable entrante.',
            iterations,
            sense: objSense,
            dualSense: (objSense === 'MAX') ? 'MIN' : 'MAX',
            varNames,
            dualVarNames,
            origCosts: parsedCosts,
            origResources: constrs.map(c => c.rhs),
            origConstraints: constraints,
            standardForm
        };
    }

    const altIter1 = iterations.find(it => it.isAlternativeOptimal1);
    const altIter2 = iterations.find(it => it.isAlternativeOptimal2);
    const hasAlternatives = !!(altIter1 && altIter2);

    const finalSnap = iterations[iterations.length - 1].snap;

    // Check Incompatibility: any artificial variable remains in base with B_i > 0
    let isIncompatible = false;
    let incompArtVar = '';
    for (let i = 0; i < m; i++) {
        const bIdx = base[i];
        if (artCols.some(ac => ac.col === bIdx) && A[i][totalCols].gt(F(0))) {
            isIncompatible = true;
            incompArtVar = varNames[bIdx];
            break;
        }
    }

    if (isIncompatible) {
        return {
            verdict: 'INCOMPATIBLE',
            title: 'Sistema Incompatible',
            badgeClass: 'incompatible',
            verdictMsg: `El sistema no posee ninguna solución factible ($\\mathcal{R} = \\emptyset$). La variable artificial <b>${formatVarMath(incompArtVar)}</b> no pudo eliminarse de la base y mantiene la penalización $M$ en el funcional ($Z = ${finalSnap.Z.toTex()}$).`,
            iterations,
            sense: objSense,
            dualSense: (objSense === 'MAX') ? 'MIN' : 'MAX',
            Z: finalSnap.Z,
            varNames,
            dualVarNames,
            origCosts: parsedCosts,
            origResources: constrs.map(c => c.rhs),
            origConstraints: constraints,
            base: finalSnap.baseRows.map(b => ({
                var: b.var,
                ck: (b.ck.q && b.ck.q.isZero()) ? b.ck.p : b.ck,
                B: b.B,
                row: b.row
            })),
            zj_cj: finalSnap.zj_cj.map(z => (z.q && z.q.isZero()) ? z.p : z),
            standardForm
        };
    }

    let finalZ = finalSnap.Z.q.isZero() ? finalSnap.Z.p : finalSnap.Z;

    // Degeneracy (check in base 1 if alternative exists)
    let isDegenerate = false;
    const baseToCheck = altIter1 ? altIter1.snap.baseRows : finalSnap.baseRows;
    for (let i = 0; i < m; i++) {
        if (baseToCheck[i].B.isZero()) {
            isDegenerate = true;
            break;
        }
    }

    let verdictTitle = 'Solución Óptima Única Factible';
    let verdict = 'OPTIMAL_UNIQUE';
    let badgeClass = 'optimal';
    let verdictMsg = `Se alcanzó la solución óptima única con $Z = ${finalZ.toTex()}$. Todos los indicadores de variables no básicas son estrictamente no nulos.`;

    let alternativeData = null;

    if (hasAlternatives) {
        verdict = isDegenerate ? 'OPTIMAL_ALT_DEGENERATE' : 'OPTIMAL_ALTERNATIVES';
        verdictTitle = isDegenerate ? 'Soluciones Múltiples (Alternativas) y Degenerada' : 'Soluciones Múltiples (Alternativas)';
        badgeClass = 'alternative';
        verdictMsg = `Existen <b>infinitas soluciones óptimas</b> con el mismo valor del funcional $Z^* = ${finalZ.toTex()}$. En la tabla óptima 1, la variable no básica <b>${formatVarMath(altIter1.altCandidateVar)}</b> presenta costo reducido <b>$0^*$</b>, lo que permite pivotear hacia la tabla óptima alternativa 2.`;

        const totalV = varNames.length;
        const v1 = new Array(totalV).fill(F(0));
        const v2 = new Array(totalV).fill(F(0));

        altIter1.snap.baseRows.forEach(b => { v1[b.colIdx] = b.B; });
        altIter2.snap.baseRows.forEach(b => { v2[b.colIdx] = b.B; });

        alternativeData = {
            hasAlternatives: true,
            varNames: [...varNames],
            nDecisionVars: n,
            altInVar: altIter1.altCandidateVar,
            altOutVar: altIter1.outVar,
            returningVar: altIter2.altReturningVar,
            sol1: {
                baseRows: altIter1.snap.baseRows,
                vector: v1,
                Z: altIter1.snap.Z
            },
            sol2: {
                baseRows: altIter2.snap.baseRows,
                vector: v2,
                Z: altIter2.snap.Z
            }
        };
    } else if (isDegenerate) {
        verdict = 'OPTIMAL_DEGENERATE';
        verdictTitle = 'Solución Óptima Degenerada';
        badgeClass = 'degenerate';
        verdictMsg = `Se alcanzó la solución óptima con $Z = ${finalZ.toTex()}$, pero es **degenerada** ya que al menos una variable básica tiene valor $B = 0$.`;
    }

    const origResources = constrs.map(c => c.rhs);
    const origCosts = [...parsedCosts];
    for (let i = 0; i < constraintCols.length; i++) origCosts.push(F(0));

    const primarySnap = altIter1 ? altIter1.snap : finalSnap;

    return {
        id: 'solved_primal',
        title: verdictTitle,
        verdict,
        badgeClass,
        verdictMsg,
        sense: objSense,
        dualSense: (objSense === 'MAX') ? 'MIN' : 'MAX',
        Z: finalZ,
        varNames,
        dualVarNames,
        origCosts,
        origResources,
        origConstraints: constraints,
        eqCoeffs: constrs,
        base: primarySnap.baseRows.map(b => ({
            var: b.var,
            ck: (b.ck.q && b.ck.q.isZero()) ? b.ck.p : b.ck,
            B: b.B,
            row: b.row
        })),
        zj_cj: primarySnap.zj_cj.map(z => (z.q && z.q.isZero()) ? z.p : z),
        iterations,
        standardForm,
        alternativeData
    };
}

export function solveSimplexPrimal(objSense, objCoeffs, constraints) {
    return solveSimplexWithHistory(objSense, objCoeffs, constraints);
}
