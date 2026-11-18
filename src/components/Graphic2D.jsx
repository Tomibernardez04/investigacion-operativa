import React, { useState } from 'react';
import { toFloat, F } from '../logic/math.js';
import {
    computeOptimalBounds,
    computeFeasiblePolygon,
    getLineSegmentInBox,
    formatTickVal
} from '../logic/graphic2D.js';

export default function Graphic2D({
    history,
    currentIter = 0,
    varPrefix = 'x',
    funcName = 'Z',
    onIterChange,
    onClose
}) {
    const [scaleMode, setScaleMode] = useState('compact'); // 'mini' | 'compact' | 'standard'

    const constraints = history?.origConstraints || history?.eqCoeffs || [];
    const origCosts = history?.origCosts || [];

    if (!history || constraints.length === 0) {
        return null;
    }

    const nDecision = constraints[0].coeffs.length;

    // For 3 or more decision variables, explain why 2D graph is not applicable
    if (nDecision !== 2) {
        const subDigits = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        const varListTxt = Array.from({ length: nDecision }, (_, i) => `${varPrefix}${subDigits[i] || (i + 1)}`).join(', ');
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                margin: '20px auto 0 auto',
                maxWidth: '660px'
            }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📐</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    Método Gráfico No Aplicable ({nDecision} variables de decisión)
                </div>
                <div style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
                    Este problema cuenta con <strong style={{ color: '#38bdf8' }}>{nDecision} variables de decisión</strong> ({varListTxt}).<br />
                    El método gráfico cartesiano solo se puede aplicar a problemas en el plano con <strong>2 variables</strong> ({varPrefix}₁, {varPrefix}₂).<br />
                    Para 3 o más variables, la resolución completa se realiza paso a paso mediante la <strong>Tabla Simplex matricial</strong> interactiva que se visualiza arriba.
                </div>
            </div>
        );
    }

    const c1 = origCosts[0] ? toFloat(origCosts[0]) : 0;
    const c2 = origCosts[1] ? toFloat(origCosts[1]) : 0;
    const isMin = (history.sense === 'MIN');

    // Build trajectory up to current iteration
    const trajectory = [];
    const iters = (history.iterations && history.iterations.length > 0)
        ? history.iterations
        : [{ snap: { baseRows: history.base || [], Z: history.Z || F(0) } }];
    const maxIter = iters.length - 1;
    for (let i = 0; i <= currentIter; i++) {
        const it = iters[i];
        let px = 0, py = 0;
        if (it && it.snap && it.snap.baseRows) {
            it.snap.baseRows.forEach(b => {
                const cleanName = (b.var || '').replace(/[_{}\$]/g, '').toLowerCase();
                const target1 = `${varPrefix}1`.toLowerCase();
                const target2 = `${varPrefix}2`.toLowerCase();
                if (cleanName === target1) px = toFloat(b.B);
                if (cleanName === target2) py = toFloat(b.B);
            });
        }
        let zVal = 0;
        if (it && it.snap && it.snap.Z) {
            zVal = toFloat(it.snap.Z);
        }
        trajectory.push({ iter: i, x: px, y: py, Z: it && it.snap ? it.snap.Z : null, zVal });
    }

    const curPt = trajectory[currentIter] || trajectory[0] || { x: 0, y: 0, zVal: 0, Z: F(0) };
    const curIterObj = iters[currentIter] || {};

    const bounds = computeOptimalBounds(constraints, trajectory, history.alternativeData);
    const { xMax, yMax, xStep, yStep } = bounds;

    const width = 480;
    const height = 310;
    const padLeft = 46;
    const padRight = 30;
    const padTop = 24;
    const padBottom = 30;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const toSvgX = (x) => padLeft + (x / xMax) * plotWidth;
    const toSvgY = (y) => height - padBottom - (y / yMax) * plotHeight;

    const poly = computeFeasiblePolygon(constraints, xMax, yMax);
    const isIncompatible = (poly.length === 0);

    // Degeneracy check
    let tightCount = 0;
    if (Math.abs(curPt.x) < 1e-4) tightCount++;
    if (Math.abs(curPt.y) < 1e-4) tightCount++;
    constraints.forEach(c => {
        const a1 = toFloat(c.coeffs[0]);
        const a2 = toFloat(c.coeffs[1]);
        const b = toFloat(c.rhs);
        const lhs = a1 * curPt.x + a2 * curPt.y;
        if (Math.abs(lhs - b) < 1e-3) tightCount++;
    });
    const isDegenerate = (tightCount >= 3);

    let svgMaxWidth = '430px';
    if (scaleMode === 'mini') svgMaxWidth = '340px';
    if (scaleMode === 'standard') svgMaxWidth = '530px';

    const colors = ['#38bdf8', '#fb923c', '#a855f7', '#ec4899', '#facc15', '#14b8a6'];

    // Level Line of Z (Isobeneficio / Isocosto)
    const zLevelVal = c1 * curPt.x + c2 * curPt.y;
    const zSeg = getLineSegmentInBox(c1, c2, zLevelVal, xMax, yMax);
    const gradLen = Math.hypot(c1, c2);

    const isFirstDisabled = (currentIter === 0);
    const isLastDisabled = (currentIter === maxIter);

    // Status message
    const zTex = curPt.Z ? (typeof curPt.Z.toTex === 'function' ? curPt.Z.toTex() : `${curPt.zVal}`) : `${curPt.zVal}`;
    let statusText = '';
    if (curIterObj.isAlternativeOptimal1 || curIterObj.isAlternativeOptimal2) {
        statusText = <span style={{ color: '#fbbf24', fontWeight: 700 }}>⭐ Solución Alternativa (Arista Óptima)</span>;
    } else if (curIterObj.isOptimal) {
        statusText = <span style={{ color: '#34d399', fontWeight: 700 }}>🎯 Vértice Óptimo Alcanzado</span>;
    } else if (curIterObj.isUnbounded) {
        statusText = <span style={{ color: '#f87171', fontWeight: 700 }}>🚀 Polígono Abierto (No Acotado)</span>;
    } else if (isIncompatible) {
        statusText = <span style={{ color: '#f87171', fontWeight: 700 }}>❌ Sistema Incompatible (R = ∅)</span>;
    } else if (isDegenerate) {
        statusText = <span style={{ color: '#c084fc', fontWeight: 700 }}>⚡ Vértice Degenerado</span>;
    } else if (currentIter === 0) {
        statusText = <span style={{ color: '#94a3b8', fontWeight: 700 }}>📍 Solución Básica Inicial</span>;
    } else {
        statusText = <span style={{ color: '#38bdf8', fontWeight: 700 }}>➡️ Vértice Intermedio (Pivoteando)</span>;
    }

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 14px',
            maxWidth: '660px',
            margin: '20px auto 0 auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
        }}>
            {/* Header controls (matching Verificador_Pasaje_Primal_Dual.html) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📊 Gráfico 2D ({varPrefix}₁ vs {varPrefix}₂)</span>
                    </span>
                    <span className="step-badge" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        Iter {currentIter}/{maxIter}
                    </span>
                    {/* Zoom scale pills */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem' }}>
                        {[
                            { key: 'mini', label: '75%' },
                            { key: 'compact', label: '100%' },
                            { key: 'standard', label: '125%' }
                        ].map(pill => (
                            <button
                                key={pill.key}
                                type="button"
                                style={{
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 7px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    background: scaleMode === pill.key ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                                    color: scaleMode === pill.key ? '#0f172a' : '#94a3b8',
                                    fontWeight: scaleMode === pill.key ? 'bold' : 'normal'
                                }}
                                onClick={() => setScaleMode(pill.key)}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Direct Stepper Controls on 2D Graphic */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {onIterChange && (
                        <>
                            <button
                                type="button"
                                className="btn-step"
                                onClick={() => onIterChange(0)}
                                disabled={isFirstDisabled}
                                style={{ padding: '3px 7px', fontSize: '0.76rem' }}
                                title="Primera Iteración"
                            >
                                ⏮
                            </button>
                            <button
                                type="button"
                                className="btn-step"
                                onClick={() => onIterChange(Math.max(0, currentIter - 1))}
                                disabled={isFirstDisabled}
                                style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                                title="Iteración Anterior"
                            >
                                ◀ Ant
                            </button>
                            <button
                                type="button"
                                className="btn-step"
                                onClick={() => onIterChange(Math.min(maxIter, currentIter + 1))}
                                disabled={isLastDisabled}
                                style={{
                                    padding: '3px 8px',
                                    fontSize: '0.76rem',
                                    background: !isLastDisabled ? 'rgba(56, 189, 248, 0.15)' : undefined,
                                    color: !isLastDisabled ? '#38bdf8' : undefined,
                                    borderColor: !isLastDisabled ? 'rgba(56, 189, 248, 0.35)' : undefined
                                }}
                                title="Siguiente Iteración"
                            >
                                Sig ▶
                            </button>
                            <button
                                type="button"
                                className="btn-step"
                                onClick={() => onIterChange(maxIter)}
                                disabled={isLastDisabled}
                                style={{ padding: '3px 7px', fontSize: '0.76rem' }}
                                title="Última Iteración"
                            >
                                ⏭
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button
                            type="button"
                            className="btn-step"
                            onClick={onClose}
                            style={{
                                fontSize: '0.76rem',
                                padding: '3px 7px',
                                marginLeft: '2px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#f87171',
                                borderColor: 'rgba(239, 68, 68, 0.25)'
                            }}
                            title="Ocultar Gráfico 2D"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* SVG Plot */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="simplex-2d-svg"
                style={{
                    width: '100%',
                    maxWidth: svgMaxWidth,
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                    background: '#0b1120',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'max-width 0.2s ease'
                }}
            >
                <defs>
                    <linearGradient id={`polyGrad_${varPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#065f46" stopOpacity="0.12" />
                    </linearGradient>
                    <filter id={`glowCur_${varPrefix}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <marker id={`axisArrow_${varPrefix}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                    <marker id={`gradArrow_${varPrefix}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                    <marker id={`rayArrow_${varPrefix}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                    </marker>
                </defs>

                {/* X grid & ticks */}
                {Array.from({ length: Math.floor(xMax / xStep) + 1 }, (_, i) => Number((i * xStep).toFixed(6))).filter(v => v > 0).map(valX => {
                    const sx = toSvgX(valX);
                    return (
                        <g key={`x-tick-${valX}`}>
                            <line x1={sx} y1={toSvgY(0)} x2={sx} y2={toSvgY(yMax)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                            <line x1={sx} y1={toSvgY(0) - 3} x2={sx} y2={toSvgY(0) + 3} stroke="#94a3b8" strokeWidth="1.2" />
                            <text x={sx} y={toSvgY(0) + 14} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                                {formatTickVal(valX)}
                            </text>
                        </g>
                    );
                })}

                {/* Y grid & ticks */}
                {Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => Number((i * yStep).toFixed(6))).filter(v => v > 0).map(valY => {
                    const sy = toSvgY(valY);
                    return (
                        <g key={`y-tick-${valY}`}>
                            <line x1={toSvgX(0)} y1={sy} x2={toSvgX(xMax)} y2={sy} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                            <line x1={toSvgX(0) - 3} y1={sy} x2={toSvgX(0) + 3} stroke="#94a3b8" strokeWidth="1.2" />
                            <text x={toSvgX(0) - 6} y={sy + 3.5} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                                {formatTickVal(valY)}
                            </text>
                        </g>
                    );
                })}

                {/* Origin tick label */}
                <text x={toSvgX(0) - 6} y={toSvgY(0) + 14} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">0</text>

                {/* Axes lines with arrows and labels */}
                <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(xMax) + 10} y2={toSvgY(0)} stroke="#94a3b8" strokeWidth="1.8" markerEnd={`url(#axisArrow_${varPrefix})`} />
                <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(yMax) - 10} stroke="#94a3b8" strokeWidth="1.8" markerEnd={`url(#axisArrow_${varPrefix})`} />
                <text x={toSvgX(xMax) + 14} y={toSvgY(0) + 4} fill="#f1f5f9" fontSize="12" fontWeight="bold" fontFamily="sans-serif">{varPrefix}₁</text>
                <text x={toSvgX(0) - 5} y={toSvgY(yMax) - 14} fill="#f1f5f9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">{varPrefix}₂</text>

                {/* Feasible Region Polygon */}
                {!isIncompatible && poly.length >= 3 ? (
                    <polygon
                        points={poly.map(p => `${toSvgX(p[0]).toFixed(1)},${toSvgY(p[1]).toFixed(1)}`).join(' ')}
                        fill={`url(#polyGrad_${varPrefix})`}
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                ) : isIncompatible ? (
                    <g>
                        <rect x={toSvgX(0)} y={toSvgY(yMax)} width={plotWidth} height={plotHeight} fill="rgba(239,68,68,0.06)" />
                        <text x={width / 2} y={height / 2 - 8} fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                            ⚠️ Región Factible Vacía (R = ∅)
                        </text>
                        <text x={width / 2} y={height / 2 + 10} fill="#fca5a5" fontSize="10.5" fontFamily="sans-serif" textAnchor="middle">
                            No hay ningún punto que satisfaga todas las restricciones
                        </text>
                    </g>
                ) : null}

                {/* Constraint boundary lines with Direction Arrows and Badges */}
                {constraints.map((r, idx) => {
                    const color = colors[idx % colors.length];
                    const a1 = toFloat(r.coeffs[0]);
                    const a2 = toFloat(r.coeffs[1]);
                    const b = toFloat(r.rhs);
                    const seg = getLineSegmentInBox(a1, a2, b, xMax, yMax);
                    if (!seg) return null;

                    const sx1 = toSvgX(seg[0][0]);
                    const sy1 = toSvgY(seg[0][1]);
                    const sx2 = toSvgX(seg[1][0]);
                    const sy2 = toSvgY(seg[1][1]);

                    // Direction arrow(s) pointing to feasible half-plane
                    const normLen = Math.hypot(a1, a2);
                    let arrows = null;
                    if (normLen > 1e-6 && r.sign !== '=') {
                        const dirSign = (r.sign === '<=') ? -1 : 1;
                        const nx = (a1 / normLen) * dirSign;
                        const ny = -(a2 / normLen) * dirSign; // Inverted for SVG Y axis
                        const segLen = Math.hypot(sx2 - sx1, sy2 - sy1);
                        const tPositions = segLen > 120 ? [0.28, 0.52] : [0.42];

                        arrows = tPositions.map((tPos, aIdx) => {
                            const px = sx1 + tPos * (sx2 - sx1);
                            const py = sy1 + tPos * (sy2 - sy1);
                            const arrowLen = 13;
                            const qx = px + nx * arrowLen;
                            const qy = py + ny * arrowLen;

                            const backLen = 4.5;
                            const wingLen = 3.2;
                            const wx = -ny;
                            const wy = nx;
                            const bx = qx - nx * backLen;
                            const by = qy - ny * backLen;
                            const tipX1 = bx + wx * wingLen;
                            const tipY1 = by + wy * wingLen;
                            const tipX2 = bx - wx * wingLen;
                            const tipY2 = by - wy * wingLen;

                            return (
                                <g key={`arrow-${idx}-${aIdx}`}>
                                    {/* Stem */}
                                    <line x1={px.toFixed(1)} y1={py.toFixed(1)} x2={qx.toFixed(1)} y2={qy.toFixed(1)} stroke={color} strokeWidth="1.6" opacity="0.95" />
                                    {/* Arrowhead */}
                                    <polygon points={`${qx.toFixed(1)},${qy.toFixed(1)} ${tipX1.toFixed(1)},${tipY1.toFixed(1)} ${tipX2.toFixed(1)},${tipY2.toFixed(1)}`} fill={color} opacity="0.95" />
                                </g>
                            );
                        });
                    }

                    // Badge with constraint label at t = 0.78
                    const t = 0.78;
                    const midX = sx1 + t * (sx2 - sx1);
                    const midY = sy1 + t * (sy2 - sy1);

                    return (
                        <g key={`restr-${idx}`}>
                            <line x1={sx1.toFixed(1)} y1={sy1.toFixed(1)} x2={sx2.toFixed(1)} y2={sy2.toFixed(1)} stroke={color} strokeWidth="1.8" opacity="0.9" />
                            {arrows}
                            <circle cx={midX.toFixed(1)} cy={midY.toFixed(1)} r="8.5" fill={color} fillOpacity="0.95" />
                            <text x={midX.toFixed(1)} y={(midY + 3).toFixed(1)} fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                                R{idx + 1}
                            </text>
                        </g>
                    );
                })}

                {/* Extreme Vertices of Feasible Polygon */}
                {!isIncompatible && poly.length >= 3 && poly.map((p, pIdx) => (
                    <circle
                        key={`poly-vert-${pIdx}`}
                        cx={toSvgX(p[0]).toFixed(1)}
                        cy={toSvgY(p[1]).toFixed(1)}
                        r="3.5"
                        fill="#10b981"
                        stroke="#047857"
                        strokeWidth="1.2"
                    />
                ))}

                {/* Trajectory (Simplex Path) */}
                {trajectory.length > 1 && (
                    <g>
                        <path
                            d={trajectory.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)} ${toSvgY(pt.y).toFixed(1)}`).join(' ')}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="1.8"
                            strokeDasharray="4,3"
                            opacity="0.85"
                        />
                        {trajectory.slice(0, -1).map((pt, i) => {
                            const px = toSvgX(pt.x);
                            const py = toSvgY(pt.y);
                            return (
                                <g key={`traj-node-${i}`}>
                                    <circle cx={px.toFixed(1)} cy={py.toFixed(1)} r="4" fill="#f97316" />
                                    <text x={px.toFixed(1)} y={(py - 7).toFixed(1)} fill="#fed7aa" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                                        Iter {i}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* Level Line of Z (Isobeneficio / Isocosto) */}
                {zSeg && (Math.abs(c1) > 1e-4 || Math.abs(c2) > 1e-4) && (
                    <line
                        x1={toSvgX(zSeg[0][0]).toFixed(1)}
                        y1={toSvgY(zSeg[0][1]).toFixed(1)}
                        x2={toSvgX(zSeg[1][0]).toFixed(1)}
                        y2={toSvgY(zSeg[1][1]).toFixed(1)}
                        stroke="#fbbf24"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                    />
                )}

                {/* Direction vector of Z from current point */}
                {gradLen > 1e-5 && (() => {
                    const unitC1 = (c1 / gradLen) * (isMin ? -1 : 1);
                    const unitC2 = (c2 / gradLen) * (isMin ? -1 : 1);
                    const arrowScale = 32;
                    const ax1 = toSvgX(curPt.x);
                    const ay1 = toSvgY(curPt.y);
                    const ax2 = ax1 + unitC1 * arrowScale;
                    const ay2 = ay1 - unitC2 * arrowScale;
                    return (
                        <g>
                            <line
                                x1={ax1.toFixed(1)}
                                y1={ay1.toFixed(1)}
                                x2={ax2.toFixed(1)}
                                y2={ay2.toFixed(1)}
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                markerEnd={`url(#gradArrow_${varPrefix})`}
                            />
                            <text x={(ax2 + 5).toFixed(1)} y={(ay2 - 3).toFixed(1)} fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                                {funcName}
                            </text>
                        </g>
                    );
                })()}

                {/* Alternative Optimal Segment Highlight */}
                {(curIterObj.isAlternativeOptimal1 || curIterObj.isAlternativeOptimal2 || (history.alternativeData && history.alternativeData.hasAlternatives)) && history.alternativeData && (() => {
                    const v1 = history.alternativeData.sol1.vector;
                    const v2 = history.alternativeData.sol2.vector;
                    const v1x = toSvgX(toFloat(v1[0]));
                    const v1y = toSvgY(toFloat(v1[1]));
                    const v2x = toSvgX(toFloat(v2[0]));
                    const v2y = toSvgY(toFloat(v2[1]));
                    return (
                        <g>
                            <line x1={v1x.toFixed(1)} y1={v1y.toFixed(1)} x2={v2x.toFixed(1)} y2={v2y.toFixed(1)} stroke="#fbbf24" strokeWidth="4" opacity="0.85" />
                            <circle cx={v1x.toFixed(1)} cy={v1y.toFixed(1)} r="5.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                            <circle cx={v2x.toFixed(1)} cy={v2y.toFixed(1)} r="5.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                            <text x={v1x.toFixed(1)} y={(v1y - 8).toFixed(1)} fill="#fde68a" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Óptimo 1</text>
                            <text x={v2x.toFixed(1)} y={(v2y - 8).toFixed(1)} fill="#fde68a" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Óptimo 2</text>
                        </g>
                    );
                })()}

                {/* Unbounded Ray */}
                {curIterObj.isUnbounded && curIterObj.unboundedDirection && (() => {
                    const uDir = curIterObj.unboundedDirection;
                    const dirX = toFloat(uDir[0]);
                    const dirY = toFloat(uDir[1]);
                    const rayLen = Math.hypot(dirX, dirY);
                    if (rayLen > 1e-5) {
                        const rayScale = 50;
                        const rx1 = toSvgX(curPt.x);
                        const ry1 = toSvgY(curPt.y);
                        const rx2 = rx1 + (dirX / rayLen) * rayScale;
                        const ry2 = ry1 - (dirY / rayLen) * rayScale;
                        return (
                            <g>
                                <line x1={rx1.toFixed(1)} y1={ry1.toFixed(1)} x2={rx2.toFixed(1)} y2={ry2.toFixed(1)} stroke="#f87171" strokeWidth="2.2" strokeDasharray="5,3" markerEnd={`url(#rayArrow_${varPrefix})`} />
                                <text x={(rx2 + 5).toFixed(1)} y={(ry2 - 4).toFixed(1)} fill="#f87171" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                                    Ray {funcName}→±∞
                                </text>
                            </g>
                        );
                    }
                    return null;
                })()}

                {/* Current Active Vertex with Glow */}
                {(() => {
                    const acx = toSvgX(curPt.x);
                    const acy = toSvgY(curPt.y);
                    return (
                        <g>
                            <circle cx={acx.toFixed(1)} cy={acy.toFixed(1)} r="10" fill="none" stroke="#38bdf8" strokeWidth="1.8" opacity="0.65" />
                            <circle cx={acx.toFixed(1)} cy={acy.toFixed(1)} r="5" fill="#38bdf8" filter={`url(#glowCur_${varPrefix})`} />
                            <title>Vértice actual: ({varPrefix}₁ = {Number(curPt.x.toFixed(2))}, {varPrefix}₂ = {Number(curPt.y.toFixed(2))})</title>
                        </g>
                    );
                })()}
            </svg>

            {/* Information & Legend Bar below SVG */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f1f5f9' }}>
                        📍 Punto actual: <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>({varPrefix}₁ = {Number(curPt.x.toFixed(2))}, {varPrefix}₂ = {Number(curPt.y.toFixed(2))})</span>
                        &nbsp;|&nbsp;
                        <span style={{ color: '#fbbf24' }}>{funcName} = {zTex}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                        {statusText}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.76rem', color: '#cbd5e1', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.35)', border: '1px solid #10b981', borderRadius: '2px' }} />
                        Región Factible <i>R</i>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', background: '#fbbf24', display: 'inline-block' }} />
                        Recta Nivel {funcName}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '7px', height: '7px', background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 5px #38bdf8' }} />
                        Vértice Actual
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #f97316', display: 'inline-block' }} />
                        Trayectoria Simplex
                    </span>
                </div>
            </div>
        </div>
    );
}
