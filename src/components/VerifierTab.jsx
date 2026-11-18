import React, { useState, useEffect } from 'react';
import MathView from './MathView.jsx';
import { PRESETS } from '../data/presets.js';
import { solveDual } from '../logic/primalDual.js';
import { Fraction, F, formatVarMath } from '../logic/math.js';
import { renderLatexInHtml } from '../logic/katexHelper.js';

function formatPrimalEquationsHtml(data) {
    if (!data) return '<p style="color: var(--text-muted);">No hay ecuaciones cargadas.</p>';

    const sense = (data.sense === 'MIN') ? '\\text{Min }' : '\\text{Max }';
    let zFormula = `$$\\mathbf{${sense} Z = `;

    let nDec = 0;
    if (data.eqCoeffs && data.eqCoeffs.length > 0 && data.eqCoeffs[0].coeffs) {
        nDec = data.eqCoeffs[0].coeffs.length;
    } else if (data.origCosts) {
        nDec = data.origCosts.length;
    }

    const costTerms = [];
    for (let j = 0; j < nDec; j++) {
        const cVal = data.origCosts && data.origCosts[j] ? data.origCosts[j] : F(0);
        if (j === 0) {
            costTerms.push(`${cVal.toTex()} x_{${j + 1}}`);
        } else {
            if (cVal.lt(F(0))) {
                costTerms.push(`- ${cVal.neg().toTex()} x_{${j + 1}}`);
            } else {
                costTerms.push(`+ ${cVal.toTex()} x_{${j + 1}}`);
            }
        }
    }
    zFormula += (costTerms.length > 0 ? costTerms.join(' ') : '0') + `}$$`;

    let restrsHtml = `<div style="margin-top: 6px;"><b>Sujeto a las restricciones:</b><br>`;
    if (data.eqCoeffs && data.eqCoeffs.length > 0) {
        data.eqCoeffs.forEach((row, i) => {
            let rowTex = `$$R_{${i + 1}}: \\quad `;
            const rowTerms = [];
            row.coeffs.forEach((coef, j) => {
                if (j === 0) {
                    rowTerms.push(`${coef.toTex()} x_{${j + 1}}`);
                } else {
                    if (coef.lt(F(0))) {
                        rowTerms.push(`- ${coef.neg().toTex()} x_{${j + 1}}`);
                    } else {
                        rowTerms.push(`+ ${coef.toTex()} x_{${j + 1}}`);
                    }
                }
            });
            const comp = row.sign === '<=' ? '\\le' : (row.sign === '>=' ? '\\ge' : '=');
            rowTex += rowTerms.join(' ') + ` ${comp} ${row.rhs.toTex()}$$`;
            restrsHtml += rowTex;
        });
        restrsHtml += `$$x_j \\ge 0 \\quad (j = 1, \\dots, ${nDec})$$`;
    } else if (data.origResources) {
        data.origResources.forEach((res, i) => {
            restrsHtml += `$$R_{${i + 1}}: \\quad \\dots \\le ${res.toTex()}$$`;
        });
    }
    restrsHtml += `</div>`;

    return zFormula + restrsHtml;
}

export default function VerifierTab() {
    const [selectedPresetKey, setSelectedPresetKey] = useState('slides_metal');
    const primalData = PRESETS[selectedPresetKey];
    const dual = solveDual(primalData);

    const [userW, setUserW] = useState('');
    const [userCk, setUserCk] = useState({});
    const [userYk, setUserYk] = useState({});
    const [userB, setUserB] = useState({});
    const [userMatrix, setUserMatrix] = useState({});
    const [userZj, setUserZj] = useState({});

    const [checked, setChecked] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null);

    // Reset user inputs on preset change
    useEffect(() => {
        handleClear();
    }, [selectedPresetKey]);

    const handleClear = () => {
        setUserW('');
        setUserCk({});
        setUserYk({});
        setUserB({});
        setUserMatrix({});
        setUserZj({});
        setChecked(false);
        setValidationStatus(null);
    };

    const handleAutoFill = () => {
        if (!dual) return;
        setUserW(dual.W.toTex());
        const newCk = {}, newYk = {}, newB = {}, newMat = {}, newZj = {};
        dual.dualBase.forEach((db, rIdx) => {
            newCk[rIdx] = db.ck.toTex();
            newYk[rIdx] = db.dualVar;
            newB[rIdx] = db.B.toTex();
            dual.matrixRows[rIdx].forEach((val, cIdx) => {
                newMat[`${rIdx}-${cIdx}`] = val.toTex();
            });
        });
        dual.zj_cj.forEach((val, cIdx) => {
            newZj[cIdx] = val.toTex();
        });
        setUserCk(newCk);
        setUserYk(newYk);
        setUserB(newB);
        setUserMatrix(newMat);
        setUserZj(newZj);
        setChecked(true);
        const total = 1 + dual.dualBase.length * (3 + dual.dualVarNames.length) + dual.zj_cj.length;
        setValidationStatus({
            isCorrect: true,
            correct: total,
            total,
            errors: []
        });
    };

    const handleCheck = () => {
        if (!dual) return;
        let total = 0, correct = 0;
        const errors = [];

        // Check W
        total++;
        if (userW && new Fraction(userW).equals(dual.W)) {
            correct++;
        } else {
            errors.push(`Funcional $W$: Debería ser $${dual.W.toTex()}$`);
        }

        // Check Base rows
        dual.dualBase.forEach((db, rIdx) => {
            // ck
            total++;
            if (userCk[rIdx] && new Fraction(userCk[rIdx]).equals(db.ck)) {
                correct++;
            } else {
                errors.push(`Fila ${rIdx + 1} $c_k$: Debería ser $${db.ck.toTex()}$`);
            }

            // yk
            total++;
            const cleanUserYk = (userYk[rIdx] || '').replace(/[_{\}\$]/g, '').trim().toLowerCase();
            const cleanTargetYk = db.dualVar.replace(/[_{\}\$]/g, '').trim().toLowerCase();
            if (cleanUserYk === cleanTargetYk && cleanUserYk !== '') {
                correct++;
            } else {
                errors.push(`Fila ${rIdx + 1} variable básica: Debería ser $${db.dualVar}$`);
            }

            // B
            total++;
            if (userB[rIdx] && new Fraction(userB[rIdx]).equals(db.B)) {
                correct++;
            } else {
                errors.push(`Fila ${rIdx + 1} $B$: Debería ser $${db.B.toTex()}$`);
            }

            // Matrix cells
            dual.matrixRows[rIdx].forEach((targetVal, cIdx) => {
                total++;
                const cellVal = userMatrix[`${rIdx}-${cIdx}`];
                if (cellVal && new Fraction(cellVal).equals(targetVal)) {
                    correct++;
                }
            });
        });

        // Check zj_cj
        dual.zj_cj.forEach((targetVal, cIdx) => {
            total++;
            const cleanZj = (userZj[cIdx] || '').replace('*', '').trim();
            if (cleanZj && new Fraction(cleanZj).equals(targetVal)) {
                correct++;
            }
        });

        setChecked(true);
        setValidationStatus({
            isCorrect: correct === total,
            correct,
            total,
            errors
        });
    };

    const isCellCorrect = (userVal, targetVal) => {
        if (!checked) return '';
        if (!userVal) return 'wrong';
        try {
            return new Fraction(userVal).equals(targetVal) ? 'correct' : 'wrong';
        } catch (e) {
            return 'wrong';
        }
    };

    const isVarCorrect = (userVal, targetVal) => {
        if (!checked) return '';
        const cleanUser = (userVal || '').replace(/[_{\}\$]/g, '').trim().toLowerCase();
        const cleanTarget = (targetVal || '').replace(/[_{\}\$]/g, '').trim().toLowerCase();
        return (cleanUser === cleanTarget && cleanUser !== '') ? 'correct' : 'wrong';
    };

    return (
        <div className="tab-view active">
            {/* Header Card */}
            <div className="card-panel">
                <div className="stepper-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                            Modo Práctica: Ingresá tus resultados del Dual
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Completá las celdas de la tabla dual en base a la tabla primal y las ecuaciones del problema directo. Hacé clic en "Comprobar Respuestas" para verificar signo, transposición y base.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                Ejercicio:
                            </label>
                            <select
                                className="form-control"
                                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                                value={selectedPresetKey}
                                onChange={(e) => setSelectedPresetKey(e.target.value)}
                            >
                                {Object.entries(PRESETS).map(([k, p]) => (
                                    <option key={k} value={k}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn-action" onClick={handleCheck}>✓ Comprobar Respuestas</button>
                        <button className="btn-step" onClick={handleAutoFill}>⚡ Revelar Solución</button>
                        <button className="btn-step" onClick={handleClear}>↺ Limpiar</button>
                    </div>
                </div>

                {/* Initial Primal Equations Box */}
                <div
                    className="equation-box"
                    dangerouslySetInnerHTML={{ __html: renderLatexInHtml(formatPrimalEquationsHtml(primalData)) }}
                    style={{ marginTop: '12px', fontSize: '0.9rem' }}
                />
            </div>

            {/* Results Feedback */}
            {checked && validationStatus && (
                <div className="results-box" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginTop: '14px',
                    padding: '14px',
                    background: validationStatus.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    border: `1px solid ${validationStatus.isCorrect ? 'var(--success)' : 'var(--warning)'}`,
                    borderRadius: 'var(--radius-sm)'
                }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: validationStatus.isCorrect ? 'var(--success)' : 'var(--warning)' }}>
                        {validationStatus.isCorrect
                            ? `🎉 ¡IMPECABLE! ${validationStatus.correct}/${validationStatus.total} Celdas Correctas`
                            : `⚠️ Tenés ${validationStatus.total - validationStatus.correct} valores para corregir (${validationStatus.correct}/${validationStatus.total} correctos)`}
                    </div>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: renderLatexInHtml(validationStatus.isCorrect
                                ? '¡Completaste toda la tabla dual a la perfección cumpliendo con todas las reglas de transposición y signos!'
                                : (validationStatus.errors.length > 0 ? validationStatus.errors.slice(0, 3).join(' • ') : 'Revisá las celdas marcadas en rojo (atención al cambio de signo en la traspuesta o en la fila $z_j - c_j$).'))
                        }}
                        style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}
                    />
                </div>
            )}

            {/* Side-by-side Tables */}
            <div className="stepper-tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {/* Given Primal */}
                <div className="table-card primal-card">
                    <div className="table-card-header">
                        <span className="badge-type badge-primal">PRIMAL DIRECTO</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                            Z = {primalData.Z ? primalData.Z.toTex() : '0'}
                        </span>
                    </div>
                    <div className="table-card-body" style={{ overflowX: 'auto' }}>
                        <table className="simplex-table">
                            <thead>
                                <tr>
                                    <th><MathView math="c_k" /></th>
                                    <th><MathView math="x_k" /></th>
                                    <th><MathView math="B" /></th>
                                    {primalData.varNames.map((v, i) => {
                                        const dv = primalData.dualVarNames[i] || (`y${i + 1}`);
                                        return (
                                            <th key={`pv-${i}`}>
                                                <MathView math={v} />
                                                <span className="col-dual-mapping">
                                                    <MathView math={dv} />
                                                </span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {primalData.base.map((bRow, rIdx) => {
                                    const isDegPrimalB = bRow.B && typeof bRow.B.isZero === 'function' && bRow.B.isZero();
                                    return (
                                        <tr key={`p-row-${rIdx}`}>
                                            <td><MathView math={bRow.ck.toTex()} /></td>
                                            <td className="cell-base"><MathView math={bRow.var} /></td>
                                            <td className={`cell-b ${isDegPrimalB ? 'hl-degenerate' : ''}`}>
                                                {isDegPrimalB ? (
                                                    <b className="deg-zero-simple" title="Solución óptima degenerada: variable básica con B = 0">0</b>
                                                ) : (
                                                    <MathView math={bRow.B.toTex()} />
                                                )}
                                            </td>
                                            {bRow.row.map((cell, cIdx) => (
                                                <td key={`p-cell-${rIdx}-${cIdx}`}><MathView math={cell.toTex()} /></td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                <tr className="zj-row">
                                    <td></td>
                                    <td><MathView math="z_j - c_j" /></td>
                                    <td><b><MathView math={primalData.Z.toTex()} /></b></td>
                                    {primalData.zj_cj.map((val, idx) => {
                                        const isPrimalNB = !primalData.base.some(b => b.var.trim().toLowerCase() === primalData.varNames[idx].trim().toLowerCase());
                                        const isAltZero = isPrimalNB && typeof val.isZero === 'function' && val.isZero();
                                        return (
                                            <td key={`pzj-${idx}`}>
                                                {isAltZero ? (
                                                    <span className="alt-zero-simple" title="Solución alternativa: variable no básica con costo reducido 0*">0*</span>
                                                ) : (
                                                    <b><MathView math={val.toTex()} /></b>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Dual Input Table */}
                <div className="table-card dual-card">
                    <div className="table-card-header">
                        <span className="badge-type badge-dual">TU TABLA DUAL</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-dual)' }}>W = </span>
                            <input
                                type="text"
                                className={`cell-input ${isCellCorrect(userW, dual.W)}`}
                                style={{ width: '60px' }}
                                value={userW}
                                onChange={(e) => setUserW(e.target.value)}
                                placeholder="W"
                            />
                        </div>
                    </div>
                    <div className="table-card-body" style={{ overflowX: 'auto' }}>
                        <table className="simplex-table">
                            <thead>
                                <tr>
                                    <th><MathView math="c_k" /></th>
                                    <th><MathView math="y_k" /></th>
                                    <th><MathView math="B" /></th>
                                    {dual.dualVarNames.map((dv, i) => (
                                        <th key={`dv-${i}`}><MathView math={dv} /></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dual.dualBase.map((dbRow, rIdx) => (
                                    <tr key={`u-row-${rIdx}`}>
                                        <td>
                                            <input
                                                type="text"
                                                className={`cell-input ${isCellCorrect(userCk[rIdx], dbRow.ck)}`}
                                                style={{ width: '50px' }}
                                                value={userCk[rIdx] || ''}
                                                onChange={(e) => setUserCk({ ...userCk, [rIdx]: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={`cell-input ${isVarCorrect(userYk[rIdx], dbRow.dualVar)}`}
                                                style={{ width: '55px' }}
                                                value={userYk[rIdx] || ''}
                                                onChange={(e) => setUserYk({ ...userYk, [rIdx]: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={`cell-input ${isCellCorrect(userB[rIdx], dbRow.B)}`}
                                                style={{ width: '50px' }}
                                                value={userB[rIdx] || ''}
                                                onChange={(e) => setUserB({ ...userB, [rIdx]: e.target.value })}
                                            />
                                        </td>
                                        {dual.matrixRows[rIdx].map((targetVal, cIdx) => (
                                            <td key={`u-cell-${rIdx}-${cIdx}`}>
                                                <input
                                                    type="text"
                                                    className={`cell-input ${isCellCorrect(userMatrix[`${rIdx}-${cIdx}`], targetVal)}`}
                                                    style={{ width: '45px' }}
                                                    value={userMatrix[`${rIdx}-${cIdx}`] || ''}
                                                    onChange={(e) => setUserMatrix({ ...userMatrix, [`${rIdx}-${cIdx}`]: e.target.value })}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr className="zj-row">
                                    <td></td>
                                    <td><MathView math="z_j - c_j" /></td>
                                    <td>---</td>
                                    {dual.zj_cj.map((targetVal, cIdx) => (
                                        <td key={`uzj-${cIdx}`}>
                                            <input
                                                type="text"
                                                className={`cell-input ${isCellCorrect(userZj[cIdx], targetVal)}`}
                                                style={{ width: '45px' }}
                                                value={userZj[cIdx] || ''}
                                                onChange={(e) => setUserZj({ ...userZj, [cIdx]: e.target.value })}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
