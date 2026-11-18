import React, { useState } from 'react';
import { toFloat } from '../logic/math.js';
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
    funcName = 'Z'
}) {
    const [scaleMode, setScaleMode] = useState('compact'); // 'compact' | 'mini' | 'standard'

    if (!history || !history.origConstraints || history.origConstraints.length === 0) {
        return null;
    }

    const nDecision = history.origConstraints[0].coeffs.length;

    // For 3 or more decision variables, explain why 2D graph is not applicable
    if (nDecision !== 2) {
        const subDigits = ['₁', '₂', '₃', '₄', '₅', '₆'];
        const varListTxt = Array.from({ length: nDecision }, (_, i) => `${varPrefix}${subDigits[i] || (i + 1)}`).join(', ');
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                margin: '16px auto',
                maxWidth: '660px'
            }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📐</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    Método Gráfico No Aplicable ({nDecision} variables de decisión)
                </div>
                <div style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
                    Este problema cuenta con <strong style={{ color: '#38bdf8' }}>{nDecision} variables de decisión</strong> ({varListTxt}).<br />
                    El método gráfico cartesiano solo se puede aplicar a problemas en el plano con <strong>2 variables</strong> ({varPrefix}₁, {varPrefix}₂).<br />
                    Para 3 o más variables, la resolución completa se realiza paso a paso mediante la <strong>Tabla Simplex matricial</strong> interactiva de arriba.
                </div>
            </div>
        );
    }

    const c1 = toFloat(history.origCosts[0]);
    const c2 = toFloat(history.origCosts[1]);
    const constraints = history.origConstraints;
    const isMin = (history.sense === 'MIN');

    // Build trajectory up to current iteration
    const trajectory = [];
    for (let i = 0; i <= currentIter; i++) {
        const it = history.iterations[i];
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
        trajectory.push({ iter: i, x: px, y: py, zVal });
    }

    const curPt = trajectory[currentIter] || trajectory[0] || { x: 0, y: 0, zVal: 0 };
    const curIterObj = history.iterations[currentIter] || {};

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

    const colors = ['#f43f5e', '#a855f7', '#38bdf8', '#fb923c', '#eab308', '#ec4899'];

    let svgMaxWidth = '430px';
    if (scaleMode === 'mini') svgMaxWidth = '340px';
    if (scaleMode === 'standard') svgMaxWidth = '530px';

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '16px'
        }}>
            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    📊 Plano Cartesiano 2D ({varPrefix}₁ vs {varPrefix}₂)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['mini', 'compact', 'standard'].map(mode => (
                        <button
                            key={mode}
                            type="button"
                            className="btn-step"
                            style={{
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                background: scaleMode === mode ? 'var(--primary)' : 'transparent',
                                color: scaleMode === mode ? '#041019' : 'var(--text-muted)'
                            }}
                            onClick={() => setScaleMode(mode)}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                style={{
                    width: '100%',
                    maxWidth: svgMaxWidth,
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                    background: '#0b1120',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                <defs>
                    <linearGradient id={`polyGrad_${varPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#065f46" stopOpacity="0.12" />
                    </linearGradient>
                    <marker id={`axisArrow_${varPrefix}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* X grid & ticks */}
                {Array.from({ length: Math.floor(xMax / xStep) + 1 }, (_, i) => i * xStep).filter(v => v > 0).map(valX => {
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
                {Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep).filter(v => v > 0).map(valY => {
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

                {/* Origin tick */}
                <text x={toSvgX(0) - 6} y={toSvgY(0) + 14} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">0</text>

                {/* Axes */}
                <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(xMax) + 10} y2={toSvgY(0)} stroke="#94a3b8" strokeWidth="1.8" markerEnd={`url(#axisArrow_${varPrefix})`} />
                <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(yMax) - 10} stroke="#94a3b8" strokeWidth="1.8" markerEnd={`url(#axisArrow_${varPrefix})`} />
                <text x={toSvgX(xMax) + 14} y={toSvgY(0) + 4} fill="#f1f5f9" fontSize="12" fontWeight="bold">{varPrefix}₁</text>
                <text x={toSvgX(0) - 5} y={toSvgY(yMax) - 14} fill="#f1f5f9" fontSize="12" fontWeight="bold" textAnchor="middle">{varPrefix}₂</text>

                {/* Feasible polygon */}
                {!isIncompatible && poly.length >= 3 && (
                    <polygon
                        points={poly.map(p => `${toSvgX(p[0])},${toSvgY(p[1])}`).join(' ')}
                        fill={`url(#polyGrad_${varPrefix})`}
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                )}

                {/* Constraint lines */}
                {constraints.map((c, i) => {
                    const a1 = toFloat(c.coeffs[0]);
                    const a2 = toFloat(c.coeffs[1]);
                    const b = toFloat(c.rhs);
                    const seg = getLineSegmentInBox(a1, a2, b, xMax, yMax);
                    if (!seg) return null;
                    const cColor = colors[i % colors.length];
                    return (
                        <line
                            key={`c-line-${i}`}
                            x1={toSvgX(seg[0][0])}
                            y1={toSvgY(seg[0][1])}
                            x2={toSvgX(seg[1][0])}
                            y2={toSvgY(seg[1][1])}
                            stroke={cColor}
                            strokeWidth="1.6"
                            strokeDasharray="4,2"
                        />
                    );
                })}

                {/* Trajectory path */}
                {trajectory.length > 1 && (
                    <polyline
                        points={trajectory.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ')}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        strokeDasharray="3,3"
                    />
                )}

                {/* Trajectory points */}
                {trajectory.map((p, i) => (
                    <circle
                        key={`pt-${i}`}
                        cx={toSvgX(p.x)}
                        cy={toSvgY(p.y)}
                        r={i === currentIter ? 6 : 4}
                        fill={i === currentIter ? '#38bdf8' : '#94a3b8'}
                        stroke="#0b0f19"
                        strokeWidth="1.5"
                    />
                ))}
            </svg>
        </div>
    );
}
