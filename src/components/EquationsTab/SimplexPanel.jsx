import React, { useState, useEffect, useRef } from 'react';
import MathView from '../MathView.jsx';
import Graphic2D from '../Graphic2D.jsx';
import { formatVarMath } from '../../logic/math.js';
import { renderLatexInHtml } from '../../logic/katexHelper.js';

export default function SimplexPanel({
    simplexResult,
    onClose,
    varPrefix = 'x',
    funcName = 'Z',
    isDualSimplex = false,
    primalOptZ = null
}) {
    const [currentIter, setCurrentIter] = useState(0);
    const [showGraphic2D, setShowGraphic2D] = useState(false);
    const [showStdForm, setShowStdForm] = useState(false);
    const [alpha, setAlpha] = useState(0.5);
    const panelRef = useRef(null);

    useEffect(() => {
        setCurrentIter(0);
        if (panelRef.current && typeof panelRef.current.scrollIntoView === 'function') {
            panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [simplexResult]);

    if (!simplexResult || !simplexResult.iterations) return null;

    const iterations = simplexResult.iterations;
    const maxIter = iterations.length - 1;
    const cur = iterations[currentIter] || iterations[0];
    const snap = cur.snap;

    const handleFirst = () => setCurrentIter(0);
    const handlePrev = () => setCurrentIter(prev => Math.max(0, prev - 1));
    const handleNext = () => setCurrentIter(prev => Math.min(maxIter, prev + 1));
    const handleLast = () => setCurrentIter(maxIter);

    const is2D = simplexResult.origConstraints && simplexResult.origConstraints[0].coeffs.length === 2;

    // Badges text
    let badgeText = '';
    if (cur.isAlternativeOptimal1) {
        badgeText = `Iteración ${currentIter} (Tabla Óptima 1 — 0* Detectado)`;
    } else if (cur.isAlternativeOptimal2) {
        badgeText = `Iteración ${currentIter} (Tabla Óptima Alternativa 2)`;
    } else if (currentIter === 0) {
        badgeText = isDualSimplex ? 'Tabla Inicial del Dual' : 'Tabla Inicial';
    } else if (currentIter === maxIter) {
        badgeText = isDualSimplex ? 'Tabla Final del Dual' : 'Tabla Final';
    } else {
        badgeText = `Iteración ${currentIter}`;
    }

    const showVerdict = cur.isOptimal || currentIter === maxIter || cur.isUnbounded;
    const badgeClass = simplexResult.badgeClass || 'optimal';

    return (
        <div
            ref={panelRef}
            className="card-panel"
            style={{
                borderLeft: isDualSimplex ? '4px solid var(--accent-dual)' : '4px solid var(--primary)',
                marginTop: '20px'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`badge-type ${isDualSimplex ? 'badge-dual' : 'badge-primal'}`}>
                        {isDualSimplex ? 'RESOLUCIÓN DEL DUAL (SIMPLEX)' : 'PRIMAL DIRECTO'}
                    </span>
                    <span style={{ fontWeight: 700, color: isDualSimplex ? 'var(--accent-dual)' : 'var(--primary)', fontSize: '1.05rem' }}>
                        {isDualSimplex ? 'Resolución Completa del Dual por Método Simplex' : 'Resolución Completa por Método Simplex'}
                    </span>
                </div>
                <button
                    className="btn-step"
                    onClick={onClose}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                    ✕ Ocultar
                </button>
            </div>

            {/* Standard Form Dropdown */}
            {simplexResult.standardForm && (
                <div style={{ marginBottom: '18px' }}>
                    <button
                        type="button"
                        className="btn-step"
                        style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)' }}
                        onClick={() => setShowStdForm(!showStdForm)}
                    >
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            📐 Pasaje a la Forma Estándar (Variables de Holgura, Exceso y Artificiales)
                        </span>
                        <span>{showStdForm ? '▲ Ocultar' : '▼ Ver Detalles'}</span>
                    </button>

                    {showStdForm && (
                        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '8px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Función Objetivo Estándar:</div>
                                <div className="equation-box" style={{ padding: '8px 12px' }}>
                                    <MathView math={simplexResult.standardForm.objTex} block />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Restricciones en Forma Estándar:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {simplexResult.standardForm.steps.map((st, sIdx) => (
                                    <div key={`std-${sIdx}`} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                                        <div dangerouslySetInnerHTML={{ __html: renderLatexInHtml(st.explanation) }} style={{ fontSize: '0.85rem', marginBottom: '4px' }} />
                                        <MathView math={st.stdEqTex} block />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stepper Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '12px',
                background: 'rgba(0,0,0,0.25)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="step-badge">{badgeText}</span>
                    <span style={{ fontWeight: 700, color: isDualSimplex ? 'var(--accent-dual)' : 'var(--primary)' }}>
                        {snap ? snap.phaseName : 'Método Simplex'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {is2D && (
                        <button
                            className="btn-step"
                            onClick={() => setShowGraphic2D(!showGraphic2D)}
                            style={{
                                background: isDualSimplex ? 'rgba(249, 115, 22, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                color: isDualSimplex ? '#fb923c' : '#38bdf8',
                                borderColor: isDualSimplex ? 'rgba(249, 115, 22, 0.35)' : 'rgba(14, 165, 233, 0.35)'
                            }}
                        >
                            📊 {showGraphic2D ? 'Ocultar Gráfico 2D' : `Gráfico 2D ${isDualSimplex ? 'Dual' : ''}`}
                        </button>
                    )}
                    <button className="btn-step" onClick={handleFirst} disabled={currentIter === 0}>⏮ Inicio</button>
                    <button className="btn-step" onClick={handlePrev} disabled={currentIter === 0}>◀ Anterior</button>
                    <button className="btn-step" onClick={handleNext} disabled={currentIter === maxIter}>Siguiente ▶</button>
                    <button className="btn-step" onClick={handleLast} disabled={currentIter === maxIter}>⏭ Fin</button>
                </div>
            </div>

            {/* Iteration Explanation Box (Rendered with KaTeX) */}
            {cur.explanation && (
                <div
                    className="step-explanation"
                    dangerouslySetInnerHTML={{ __html: renderLatexInHtml(cur.explanation) }}
                    style={{ marginBottom: '16px' }}
                />
            )}

            {/* Simplex Tableau Table */}
            {snap && (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table className="simplex-table">
                        <thead>
                            <tr>
                                <th><MathView math="c_k" /></th>
                                <th><MathView math={`${varPrefix}_k`} /></th>
                                <th><MathView math="B" /></th>
                                {snap.cols.map((col, cIdx) => {
                                    let hlCol = '';
                                    if (cur.isAlternativeOptimal1 && cIdx === cur.altCandidateCol) {
                                        hlCol = 'hl-alt-col';
                                    } else if (cur.isAlternativeOptimal2 && cIdx === cur.altReturningCol) {
                                        hlCol = 'hl-alt-col';
                                    } else if (cIdx === cur.inCol) {
                                        hlCol = 'hl-entering';
                                    }
                                    const costTex = (snap.costs && snap.costs[cIdx]) ? snap.costs[cIdx].toTex() : '';
                                    return (
                                        <th key={`th-${cIdx}`} className={hlCol}>
                                            {costTex !== '' && (
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.85, marginBottom: '2px' }}>
                                                    <MathView math={`${isDualSimplex ? 'b' : 'c'}_${cIdx + 1} = ${costTex}`} />
                                                </div>
                                            )}
                                            <MathView math={formatVarMath(col)} />
                                            {cIdx === cur.inCol && (
                                                <span style={{ display: 'block', fontSize: '0.65rem' }}>▼ Entra</span>
                                            )}
                                        </th>
                                    );
                                })}
                                <th><MathView math={`\\theta = \\frac{B_i}{a_{i${cur.inCol >= 0 ? cur.inCol + 1 : 'j'}}}`} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {snap.baseRows.map((bRow, rIdx) => {
                                const isLeavingRow = (rIdx === cur.outRow);
                                const rowClass = isLeavingRow ? 'hl-leaving' : '';
                                const isFinalTable = cur.isOptimal || (currentIter === maxIter);
                                const isDegB = isFinalTable && bRow.B && bRow.B.isZero();

                                return (
                                    <tr key={`row-${rIdx}`} className={rowClass}>
                                        <td><MathView math={bRow.ck.toTex()} /></td>
                                        <td className="cell-base" style={isDualSimplex ? { color: 'var(--accent-dual)' } : {}}>
                                            <MathView math={formatVarMath(bRow.var)} />
                                            {isLeavingRow && (
                                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#ef4444' }}>▲ Sale</span>
                                            )}
                                        </td>
                                        <td className={isDegB ? 'cell-b hl-degenerate' : 'cell-b'}>
                                            {isDegB ? (
                                                <div className="deg-zero-pill" title="Solución básica degenerada: variable básica con B = 0">
                                                    <span className="deg-zero-num">0</span>
                                                    <span className="deg-zero-label">Degenerada</span>
                                                </div>
                                            ) : (
                                                <MathView math={bRow.B.toTex()} />
                                            )}
                                        </td>
                                        {bRow.row.map((cell, cIdx) => {
                                            let cellClass = '';
                                            if (rIdx === cur.outRow && cIdx === cur.inCol) {
                                                cellClass = 'hl-pivot';
                                            } else if (cur.isAlternativeOptimal1 && cIdx === cur.altCandidateCol) {
                                                cellClass = 'hl-alt-col';
                                            } else if (cur.isAlternativeOptimal2 && cIdx === cur.altReturningCol) {
                                                cellClass = 'hl-alt-col';
                                            } else if (cIdx === cur.inCol) {
                                                cellClass = 'hl-entering';
                                            } else if (rIdx === cur.outRow) {
                                                cellClass = 'hl-leaving';
                                            }

                                            return (
                                                <td key={`c-${rIdx}-${cIdx}`} className={cellClass}>
                                                    <MathView math={cell.toTex()} />
                                                </td>
                                            );
                                        })}
                                        <td className={isLeavingRow ? 'hl-target' : ''}>
                                            <b>
                                                {cur.ratios && cur.ratios[rIdx] && cur.ratios[rIdx].ratio !== null ? (
                                                    <MathView math={cur.ratios[rIdx].ratio.toTex()} />
                                                ) : '---'}
                                            </b>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Zj - Cj row */}
                            <tr className="zj-row">
                                <td></td>
                                <td><MathView math={`${funcName.toLowerCase()}_j - ${isDualSimplex ? 'b' : 'c'}_j`} /></td>
                                <td>
                                    <b style={{ color: isDualSimplex ? 'var(--accent-dual)' : 'var(--primary)' }}>
                                        <MathView math={snap.Z.toTex()} />
                                    </b>
                                </td>
                                {snap.zj_cj.map((zVal, cIdx) => {
                                    let isAltZero = false;
                                    if (cur.isAlternativeOptimal1 && cIdx === cur.altCandidateCol) {
                                        isAltZero = true;
                                    } else if (cur.isAlternativeOptimal2 && cIdx === cur.altReturningCol) {
                                        isAltZero = true;
                                    }

                                    if (isAltZero) {
                                        return (
                                            <td key={`zj-${cIdx}`} className="hl-alt-zero" title="Solución alternativa: indicador 0* en variable no básica">
                                                <div className="alt-zero-pill">
                                                    <span className="alt-zero-num">0*</span>
                                                    <span className="alt-zero-label">Sol. Alternativa</span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    const hlCol = (cIdx === cur.inCol) ? 'hl-entering' : '';
                                    return (
                                        <td key={`zj-${cIdx}`} className={hlCol}>
                                            <b><MathView math={zVal.toTex()} /></b>
                                        </td>
                                    );
                                })}
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Verdict Card */}
            {showVerdict && simplexResult.verdict && (
                <div className="verdict-card" style={isDualSimplex ? { borderLeft: '4px solid var(--accent-dual)' } : {}}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span className={`verdict-badge ${badgeClass}`}>
                            ⚖️ Veredicto {isDualSimplex ? 'Dual' : ''}: {simplexResult.title}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isDualSimplex ? 'var(--accent-dual)' : 'var(--primary)', fontSize: '1.15rem' }}>
                            {funcName}* = {simplexResult.Z ? <MathView math={simplexResult.Z.toTex()} /> : '---'}
                        </span>
                    </div>

                    <div
                        dangerouslySetInnerHTML={{
                            __html: renderLatexInHtml(isDualSimplex ? simplexResult.verdictMsg.replace(/\$Z/g, '$W') : simplexResult.verdictMsg)
                        }}
                        style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-main)' }}
                    />

                    {/* If Dual Simplex: Show Fundamental Theorem of Duality Box */}
                    {isDualSimplex && simplexResult.verdict && simplexResult.verdict.startsWith('OPTIMAL') && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem', marginBottom: '4px' }}>
                                🎯 Teorema Fundamental de la Dualidad:
                            </div>
                            <div style={{ fontSize: '1rem', textAlign: 'center', margin: '8px 0', color: '#f1f5f9' }}>
                                <MathView math={`Z^*_{\\text{Primal}} = ${primalOptZ || simplexResult.Z.toTex()} \\quad \\Longleftrightarrow \\quad W^*_{\\text{Dual}} = ${simplexResult.Z.toTex()}`} block />
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                • El óptimo del Dual alcanza el mismo valor objetivo que el Primal (<MathView math="Z^* = W^*" />).<br />
                                • Los valores óptimos de las variables duales <MathView math="y_i^*" /> representan los <b>precios sombra</b> (tasa marginal de valor de cada recurso <MathView math="b_i" />).
                            </div>
                        </div>
                    )}

                    {isDualSimplex && simplexResult.verdict === 'UNBOUNDED' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.95rem', marginBottom: '4px' }}>
                                🎯 Consecuencia del Teorema Fundamental de la Dualidad:
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.5, marginTop: '6px' }}>
                                • Al ser el <b>Problema Dual No Acotado</b> (<MathView math="W \to \pm\infty" />), el <b>Problema Primal es Incompatible (Infactible)</b>.<br />
                                • No existe ninguna combinación de <MathView math="(x_1, x_2, \dots)" /> que satisfaga simultáneamente todas las restricciones del primal (región factible vacía: <MathView math="\mathcal{R}_{\text{Primal}} = \emptyset" />).
                            </div>
                        </div>
                    )}

                    {isDualSimplex && simplexResult.verdict === 'INCOMPATIBLE' && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem', marginBottom: '4px' }}>
                                🎯 Consecuencia del Teorema Fundamental de la Dualidad:
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.5, marginTop: '6px' }}>
                                • Al ser el <b>Problema Dual Incompatible</b>, el <b>Problema Primal</b> o bien es <b>No Acotado</b> o bien es <b>Incompatible</b>.
                            </div>
                        </div>
                    )}

                    {/* Multiple solutions section */}
                    {simplexResult.alternativeData && simplexResult.alternativeData.hasAlternatives && (
                        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '14px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                                    📐 Expresión General de Soluciones Alternativas (Combinación Lineal Convexa)
                                </span>
                                <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    0 ≤ α ≤ 1
                                </span>
                            </div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                                Cualquier punto sobre el segmento que conecta ambos vértices óptimos es también una solución factible óptima con <b><MathView math={`Z^* = ${simplexResult.Z.toTex()}`} /></b>:
                            </p>
                            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '6px', textAlign: 'center', marginBottom: '12px' }}>
                                <MathView math="X = \alpha \cdot X^{(1)} + (1 - \alpha) \cdot X^{(2)}, \quad 0 \le \alpha \le 1" block />
                            </div>

                            {/* Interactive alpha slider */}
                            <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fde68a' }}>
                                        🎛️ Explorador interactivo del segmento de soluciones:
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>
                                        α = {alpha.toFixed(2)} (1 - α = {(1 - alpha).toFixed(2)})
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={alpha}
                                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                                />
                                <div style={{ marginTop: '8px', fontSize: '0.85rem', textAlign: 'center', color: '#f1f5f9' }}>
                                    {(() => {
                                        const alt = simplexResult.alternativeData;
                                        const resStrs = [];
                                        for (let j = 0; j < alt.nDecisionVars; j++) {
                                            const v1 = alt.sol1.vector[j].toNumber();
                                            const v2 = alt.sol2.vector[j].toNumber();
                                            const val = alpha * v1 + (1 - alpha) * v2;
                                            resStrs.push(`${alt.varNames[j]} = ${val.toFixed(2)}`);
                                        }
                                        return <b>Punto {resStrs.join(', ')} con {funcName} = {simplexResult.Z.toTex()}</b>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic variables at optimum for unique solution */}
                    {simplexResult.base && simplexResult.base.length > 0 && !simplexResult.alternativeData?.hasAlternatives && (
                        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9rem', marginTop: '8px' }}>
                            <b>Variables básicas en el óptimo: </b>
                            {simplexResult.base.map((b, idx) => (
                                <span key={`opt-base-${idx}`}>
                                    <MathView math={`${formatVarMath(b.var).replace(/\$/g, '')} = ${b.B.toTex()}`} />
                                    {idx < simplexResult.base.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2D Graphic */}
            {is2D && showGraphic2D && (
                <Graphic2D
                    history={simplexResult}
                    currentIter={currentIter}
                    varPrefix={varPrefix}
                    funcName={funcName}
                    onIterChange={setCurrentIter}
                    onClose={() => setShowGraphic2D(false)}
                />
            )}
        </div>
    );
}
