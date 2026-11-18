import React, { useState } from 'react';
import MathView from '../MathView.jsx';
import Graphic2D from '../Graphic2D.jsx';
import { formatVarMath } from '../../logic/math.js';

export default function SimplexPanel({
    simplexResult,
    onClose
}) {
    const [currentIter, setCurrentIter] = useState(0);
    const [showGraphic2D, setShowGraphic2D] = useState(false);
    const [showStdForm, setShowStdForm] = useState(false);
    const [alpha, setAlpha] = useState(0.5);

    if (!simplexResult || !simplexResult.iterations) return null;

    const iterations = simplexResult.iterations;
    const maxIter = iterations.length - 1;
    const iterData = iterations[currentIter] || iterations[0];
    const snap = iterData.snap;

    const handleFirst = () => setCurrentIter(0);
    const handlePrev = () => setCurrentIter(prev => Math.max(0, prev - 1));
    const handleNext = () => setCurrentIter(prev => Math.min(maxIter, prev + 1));
    const handleLast = () => setCurrentIter(maxIter);

    const is2D = simplexResult.origConstraints && simplexResult.origConstraints[0].coeffs.length === 2;

    return (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--primary)', marginTop: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="badge-type badge-primal">PRIMAL DIRECTO</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
                        Resolución Completa por Método Simplex
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
                                        <div dangerouslySetInnerHTML={{ __html: st.explanation }} style={{ fontSize: '0.85rem', marginBottom: '4px' }} />
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
                    <span className="step-badge">Iteración {currentIter} de {maxIter}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {snap ? snap.phaseName : 'Método Simplex'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {is2D && (
                        <button
                            className="btn-step"
                            onClick={() => setShowGraphic2D(!showGraphic2D)}
                            style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.35)' }}
                        >
                            📊 {showGraphic2D ? 'Ocultar Gráfico 2D' : 'Gráfico 2D'}
                        </button>
                    )}
                    <button className="btn-step" onClick={handleFirst} disabled={currentIter === 0}>⏮ Inicio</button>
                    <button className="btn-step" onClick={handlePrev} disabled={currentIter === 0}>◀ Anterior</button>
                    <button className="btn-step" onClick={handleNext} disabled={currentIter === maxIter}>Siguiente ▶</button>
                    <button className="btn-step" onClick={handleLast} disabled={currentIter === maxIter}>⏭ Fin</button>
                </div>
            </div>

            {/* Iteration Explanation */}
            {iterData.explanation && (
                <div
                    className="step-explanation"
                    dangerouslySetInnerHTML={{ __html: iterData.explanation }}
                    style={{ marginBottom: '16px' }}
                />
            )}

            {/* Tableau Table */}
            {snap && (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table className="simplex-table">
                        <thead>
                            {/* Costs row */}
                            <tr className="costs-row">
                                <th colSpan={3} style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Costos originales $c_j$:
                                </th>
                                {snap.cols.map((colName, cIdx) => (
                                    <th key={`cost-${cIdx}`}>
                                        <MathView math={snap.costs[cIdx].toTex()} />
                                    </th>
                                ))}
                                {iterData.ratios && <th><MathView math="\text{Ratio } \theta" /></th>}
                            </tr>
                            {/* Column titles */}
                            <tr>
                                <th>Base</th>
                                <th><MathView math="c_k" /></th>
                                <th><MathView math="B" /></th>
                                {snap.cols.map((colName, cIdx) => {
                                    const isEntering = iterData.inCol === cIdx;
                                    return (
                                        <th
                                            key={`col-${cIdx}`}
                                            className={isEntering ? 'th-entering' : ''}
                                            style={isEntering ? { background: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8' } : {}}
                                        >
                                            <MathView math={colName.replace(/[\\\$]/g, '')} />
                                            {isEntering && <span style={{ display: 'block', fontSize: '0.65rem' }}>▼ Entra</span>}
                                        </th>
                                    );
                                })}
                                {iterData.ratios && <th><MathView math="\theta = B_i / a_{ij}" /></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {snap.baseRows.map((row, rIdx) => {
                                const isLeaving = iterData.outRow === rIdx;
                                return (
                                    <tr
                                        key={`base-${rIdx}`}
                                        className={isLeaving ? 'tr-leaving' : ''}
                                        style={isLeaving ? { background: 'rgba(239, 68, 68, 0.15)' } : {}}
                                    >
                                        <td style={{ fontWeight: 700 }}>
                                            <MathView math={row.var.replace(/[\\\$]/g, '')} />
                                            {isLeaving && <span style={{ display: 'block', fontSize: '0.65rem', color: '#ef4444' }}>▲ Sale</span>}
                                        </td>
                                        <td><MathView math={row.ck.toTex()} /></td>
                                        <td style={{ fontWeight: 700 }}><MathView math={row.B.toTex()} /></td>
                                        {row.row.map((val, cIdx) => {
                                            const isPivot = iterData.outRow === rIdx && iterData.inCol === cIdx;
                                            return (
                                                <td
                                                    key={`cell-${rIdx}-${cIdx}`}
                                                    style={isPivot ? { background: 'rgba(250, 204, 21, 0.3)', fontWeight: 800, color: '#facc15' } : {}}
                                                >
                                                    <MathView math={val.toTex()} />
                                                </td>
                                            );
                                        })}
                                        {iterData.ratios && (
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {iterData.ratios[rIdx] && iterData.ratios[rIdx].ratio !== null ? (
                                                    <MathView math={iterData.ratios[rIdx].ratio.toTex()} />
                                                ) : '-'}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {/* Zj - Cj row */}
                            <tr className="zj-cj-row" style={{ background: 'rgba(0,0,0,0.4)', fontWeight: 700 }}>
                                <td colSpan={2} style={{ textAlign: 'center' }}>$z_j - c_j$</td>
                                <td style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                                    <MathView math={`Z = ${snap.Z.toTex()}`} />
                                </td>
                                {snap.zj_cj.map((zj, cIdx) => (
                                    <td key={`zj-${cIdx}`} style={{ color: zj.isZero() ? 'var(--highlight)' : 'inherit' }}>
                                        <MathView math={zj.toTex()} />
                                    </td>
                                ))}
                                {iterData.ratios && <td></td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Verdict Card on Last Iteration */}
            {currentIter === maxIter && (
                <div className={`verdict-card verdict-${simplexResult.badgeClass}`} style={{
                    background: 'rgba(19, 27, 46, 0.85)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginTop: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className={`badge-type badge-${simplexResult.badgeClass}`} style={{ textTransform: 'uppercase' }}>
                            {simplexResult.title}
                        </span>
                        {simplexResult.Z && (
                            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                Valor Óptimo: <MathView math={`Z^* = ${simplexResult.Z.toTex()}`} />
                            </span>
                        )}
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: simplexResult.verdictMsg }} style={{ fontSize: '0.9rem', lineHeight: 1.5 }} />

                    {/* Multiple solutions alpha slider */}
                    {simplexResult.alternativeData && simplexResult.alternativeData.hasAlternatives && (
                        <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                                Segmento de Soluciones Óptimas: $X^* = \alpha X_1 + (1 - \alpha) X_2 \quad (0 \le \alpha \le 1)$
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ fontSize: '0.85rem' }}>$\alpha = {alpha}$:</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={alpha}
                                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 2D Graphic (Embedded at bottom) */}
            {is2D && showGraphic2D && (
                <Graphic2D
                    history={simplexResult}
                    currentIter={currentIter}
                    varPrefix="x"
                    funcName="Z"
                />
            )}
        </div>
    );
}
