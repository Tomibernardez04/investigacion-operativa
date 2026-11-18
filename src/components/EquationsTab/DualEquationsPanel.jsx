import React, { useState } from 'react';
import MathView from '../MathView.jsx';
import SimplexPanel from './SimplexPanel.jsx';
import { buildDualProblemFromPrimal } from '../../logic/primalDual.js';
import { solveSimplexWithHistory } from '../../logic/simplex.js';

export default function DualEquationsPanel({
    sense,
    c,
    constraints,
    onClose
}) {
    const [dualSimplexResult, setDualSimplexResult] = useState(null);

    const isPrimalMax = (sense === 'MAX');
    const dualSense = isPrimalMax ? 'MIN' : 'MAX';
    const dualComp = isPrimalMax ? '\\ge' : '\\le';
    const nRows = constraints.length;
    const nVars = c.length;

    // Build canonical constraints
    const canonicalConstraints = [];
    let neededFlip = false;
    const flipNotes = [];

    for (let i = 0; i < nRows; i++) {
        const r = constraints[i];
        if (isPrimalMax && r.sign === '>=') {
            neededFlip = true;
            canonicalConstraints.push({
                coeffs: r.coeffs.map(x => x.neg()),
                sign: '<=',
                rhs: r.rhs.neg(),
                wasFlipped: true
            });
            flipNotes.push(`• Fila ${i + 1}: Era de tipo ≥. Multiplicada por -1, queda canónica ≤ con b_${i + 1} = ${r.rhs.neg().toTex()}`);
        } else if (!isPrimalMax && r.sign === '<=') {
            neededFlip = true;
            canonicalConstraints.push({
                coeffs: r.coeffs.map(x => x.neg()),
                sign: '>=',
                rhs: r.rhs.neg(),
                wasFlipped: true
            });
            flipNotes.push(`• Fila ${i + 1}: Era de tipo ≤. Multiplicada por -1, queda canónica ≥ con b_${i + 1} = ${r.rhs.neg().toTex()}`);
        } else {
            canonicalConstraints.push({
                coeffs: [...r.coeffs],
                sign: r.sign,
                rhs: r.rhs,
                wasFlipped: false
            });
        }
    }

    const handleSolveDualSimplex = () => {
        const dualModel = buildDualProblemFromPrimal(sense, c, constraints);
        const solved = solveSimplexWithHistory(
            dualModel.dualSense,
            dualModel.dualCosts,
            dualModel.dualConstraints,
            'y',
            'W'
        );
        setDualSimplexResult(solved);
    };

    return (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-dual)', marginTop: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-dual)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span>📝 Formulación Simbólica del Problema Dual</span>
                </h3>
                <button
                    className="btn-step"
                    onClick={onClose}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                    ✕ Ocultar
                </button>
            </div>

            {/* Normalization Alert Box */}
            {neededFlip && (
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderLeft: '4px solid var(--primary)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', fontSize: '0.95rem' }}>
                        📐 Normalización a Forma Canónica (Metodología Cátedra - Dual Simétrico)
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                        En problemas de <b>{isPrimalMax ? 'Maximización' : 'Minimización'}</b>, la forma canónica de la cátedra exige que todas las desigualdades sean de tipo <b>{isPrimalMax ? '≤' : '≥'}</b> para que todas las variables duales resulten no negativas ($y_i \ge 0$):
                        <div style={{ marginTop: '6px', marginBottom: '6px', paddingLeft: '8px' }}>
                            {flipNotes.map((note, idx) => (
                                <div key={`fn-${idx}`}>{note}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Objective W equation */}
            <div className="equation-box" style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Función Objetivo Dual:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-dual)' }}>
                    <MathView
                        math={`\\text{${dualSense} } W = ` + canonicalConstraints.map((cc, i) => {
                            const bVal = cc.rhs;
                            const bSign = bVal.lt(0) ? '-' : (i === 0 ? '' : '+');
                            const bAbs = bVal.lt(0) ? bVal.neg() : bVal;
                            return `${bSign} ${bAbs.toTex()} y_{${i + 1}}`;
                        }).join(' ')}
                        block
                    />
                </div>
            </div>

            {/* Constraints */}
            <div style={{ marginBottom: '14px' }}>
                <b style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sujeto a las restricciones duales:
                </b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {Array.from({ length: nVars }, (_, j) => {
                        const lhs = canonicalConstraints.map((cc, i) => {
                            const aVal = cc.coeffs[j];
                            const aSign = aVal.lt(0) ? '-' : (i === 0 ? '' : '+');
                            const aAbs = aVal.lt(0) ? aVal.neg() : aVal;
                            return `${aSign} ${aAbs.toTex()} y_{${i + 1}}`;
                        }).join(' ');
                        const rhsVal = c[j] ? c[j].toTex() : '0';
                        return (
                            <div key={`dual-con-${j}`} className="equation-box" style={{ padding: '8px 12px' }}>
                                <MathView math={`${lhs} ${dualComp} ${rhsVal} \\quad \\text{(asociada a } x_{${j + 1}}\\text{)}`} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sign conditions */}
            <div style={{ marginBottom: '16px' }}>
                <b style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Condiciones sobre las variables duales:</b>
                <div className="equation-box" style={{ marginTop: '6px', padding: '8px 12px' }}>
                    <MathView
                        math={canonicalConstraints.map((cc, i) => (
                            cc.sign === '=' ? `y_{${i + 1}} \\text{ libre}` : `y_{${i + 1}} \\ge 0`
                        )).join(', \\quad ')}
                        block
                    />
                </div>
            </div>

            {/* Accordion note */}
            <details style={{ marginTop: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                <summary style={{ fontWeight: 600, color: '#94a3b8', cursor: 'pointer', fontSize: '0.88rem' }}>
                    💡 ¿Por qué en la Forma Canónica el signo cambia a -5 y₂ y -1 y₂ con y₂ ≥ 0? (Simétrico vs. Asimétrico)
                </summary>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', lineHeight: 1.5, color: '#cbd5e1' }}>
                    • <b>Dual Simétrico (Metodología de la Cátedra):</b> Al multiplicar la restricción por -1, el término independiente pasa a negativo y se invierte la desigualdad. Todas las variables duales resultan no negativas ($y_i \ge 0$), lo que permite resolver el Dual directamente mediante el Método Simplex.<br />
                    • <b>Dual Asimétrico (Regla General):</b> Si se mantuviese la desigualdad original, la regla general asume una variable dual no positiva ($y_i \le 0$). Al efectuar el cambio de variable estándar $y_i' = -y_i \ge 0$, se obtiene exactamente la misma formulación.
                </div>
            </details>

            {/* Action button */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                    className="btn-action dual-btn"
                    onClick={handleSolveDualSimplex}
                    style={{ fontSize: '0.95rem', padding: '10px 20px' }}
                >
                    ⚡ Resolver Dual por Simplex (Paso a Paso)
                </button>
            </div>

            {/* Dual Simplex Table Area */}
            {dualSimplexResult && (
                <SimplexPanel
                    simplexResult={dualSimplexResult}
                    onClose={() => setDualSimplexResult(null)}
                />
            )}
        </div>
    );
}
