import React, { useState, useRef, useEffect } from 'react';
import MathView from '../MathView.jsx';
import SimplexPanel from './SimplexPanel.jsx';
import { buildDualProblemFromPrimal } from '../../logic/primalDual.js';
import { solveSimplexWithHistory } from '../../logic/simplex.js';
import { renderLatexInHtml } from '../../logic/katexHelper.js';
import { F } from '../../logic/math.js';

export default function DualEquationsPanel({
    sense,
    c,
    constraints,
    primalOptZ,
    onClose
}) {
    const [dualSimplexResult, setDualSimplexResult] = useState(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (panelRef.current && typeof panelRef.current.scrollIntoView === 'function') {
            panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, []);

    const isPrimalMax = (sense === 'MAX');
    const dualSense = isPrimalMax ? 'MIN' : 'MAX';
    const dualComp = isPrimalMax ? '\\ge' : '\\le';
    const nRows = constraints.length;
    const nVars = c.length;

    // Build canonical constraints
    const canonicalConstraints = [];
    let neededFlip = false;
    const flipNotes = [];
    const flippedIndices = [];

    for (let i = 0; i < nRows; i++) {
        const r = constraints[i];
        if (isPrimalMax && r.sign === '>=') {
            neededFlip = true;
            flippedIndices.push(i);
            canonicalConstraints.push({
                coeffs: r.coeffs.map(x => x.neg()),
                sign: '<=',
                rhs: r.rhs.neg(),
                wasFlipped: true
            });
            flipNotes.push(`• <b>Fila ${i + 1}:</b> Era de tipo $\\ge$. Al multiplicar por $-1$, queda canónica $\\le$: ` +
                `$${r.coeffs.map((val, idx) => `${val.toTex()} x_${idx + 1}`).join(' + ')} \\ge ${r.rhs.toTex()} \\implies ` +
                `${r.coeffs.map((val, idx) => `${val.neg().toTex()} x_${idx + 1}`).join(' + ')} \\le ${r.rhs.neg().toTex()}$`);
        } else if (!isPrimalMax && r.sign === '<=') {
            neededFlip = true;
            flippedIndices.push(i);
            canonicalConstraints.push({
                coeffs: r.coeffs.map(x => x.neg()),
                sign: '>=',
                rhs: r.rhs.neg(),
                wasFlipped: true
            });
            flipNotes.push(`• <b>Fila ${i + 1}:</b> Era de tipo $\\le$. Al multiplicar por $-1$, queda canónica $\\ge$: ` +
                `$${r.coeffs.map((val, idx) => `${val.toTex()} x_${idx + 1}`).join(' + ')} \\le ${r.rhs.toTex()} \\implies ` +
                `${r.coeffs.map((val, idx) => `${val.neg().toTex()} x_${idx + 1}`).join(' + ')} \\ge ${r.rhs.neg().toTex()}$`);
        } else {
            canonicalConstraints.push({
                coeffs: [...r.coeffs],
                sign: r.sign,
                rhs: r.rhs,
                wasFlipped: false
            });
        }
    }

    // Build unified dual HTML exactly like Verificador_Pasaje_Primal_Dual.html
    let dualHtml = '';

    // Step 1: Info box if canonical normalization occurred
    if (neededFlip) {
        dualHtml += `
        <div style="background: rgba(56, 189, 248, 0.08); border-left: 4px solid var(--primary); padding: 12px 16px; border-radius: 6px; margin-bottom: 16px;">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 6px; font-size: 0.95rem;">
                📐 Normalización a Forma Canónica (Metodología Cátedra - Dual Simétrico)
            </div>
            <div style="font-size: 0.88rem; line-height: 1.5; color: var(--text-main);">
                En problemas de <b>${isPrimalMax ? 'Maximización' : 'Minimización'}</b>, la forma canónica de la cátedra exige que todas las desigualdades sean de tipo <b>${isPrimalMax ? '≤' : '≥'}</b> para que todas las variables duales resulten no negativas ($y_i \\ge 0$):
                <div style="margin-top: 6px; margin-bottom: 6px; padding-left: 8px;">
                    ${flipNotes.join('<br>')}
                </div>
            </div>
        </div>`;
    }

    // Step 2: Dual objective W
    dualHtml += `<b>Función Objetivo Dual:</b>`;
    dualHtml += `$$\\mathbf{\\text{${dualSense} } W = `;
    for (let i = 0; i < nRows; i++) {
        const bVal = canonicalConstraints[i].rhs;
        const bSign = bVal.lt(F(0)) ? '-' : '+';
        const bAbs = bVal.lt(F(0)) ? bVal.neg() : bVal;
        if (i === 0) {
            dualHtml += `${bVal.toTex()} y_${i + 1}`;
        } else {
            dualHtml += ` ${bSign} ${bAbs.toTex()} y_${i + 1}`;
        }
    }
    dualHtml += `}$$<br><b>Sujeto a las restricciones duales:</b><br>`;

    // Step 3: Dual constraints
    for (let j = 0; j < nVars; j++) {
        let restr = `$$`;
        for (let i = 0; i < nRows; i++) {
            const aVal = canonicalConstraints[i].coeffs[j];
            const aSign = aVal.lt(F(0)) ? '-' : '+';
            const aAbs = aVal.lt(F(0)) ? aVal.neg() : aVal;
            if (i === 0) {
                restr += `${aVal.toTex()} y_${i + 1}`;
            } else {
                restr += ` ${aSign} ${aAbs.toTex()} y_${i + 1}`;
            }
        }
        restr += ` ${dualComp} ${c[j].toTex()} \\quad \\text{(asociada a } x_${j + 1}\\text{)}$$`;
        dualHtml += restr;
    }

    // Step 4: Conditions on dual variables
    dualHtml += `<br><b>Condiciones sobre las variables duales:</b><br>`;
    const signConditions = [];
    for (let i = 0; i < nRows; i++) {
        if (canonicalConstraints[i].sign === '=') {
            signConditions.push(`y_${i + 1} \\text{ libre}`);
        } else {
            signConditions.push(`y_${i + 1} \\ge 0`);
        }
    }
    dualHtml += `$$` + signConditions.join(', \\quad ') + `$$`;

    // Step 5: Theoretical note accordion (only if canonical normalization occurred)
    if (neededFlip) {
        const flippedVarsText = flippedIndices.map(idx => `y_{${idx + 1}}`).join(', ');
        const flippedSummaryText = flippedIndices.map(idx => {
            const can = canonicalConstraints[idx];
            return `${can.rhs.toTex()} y_{${idx + 1}}`;
        }).join(' y ');

        const flippedRowsDetails = flippedIndices.map(idx => {
            const orig = constraints[idx];
            const can = canonicalConstraints[idx];
            const vName = `y_{${idx + 1}}`;
            return `• <b>Fila ${idx + 1} (asociada a $${vName}$):</b> Al multiplicar la restricción original ($${orig.sign}$) por $-1$, el término en la función objetivo dual pasa a $${can.rhs.toTex()} ${vName}$. Todas las variables duales resultan no negativas ($${vName} \\ge 0$), lo que permite resolver el Dual directamente mediante el Método Simplex.`;
        }).join('<br>');

        dualHtml += `
    <details style="margin-top: 14px; background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px;">
        <summary style="font-weight: 600; color: #94a3b8; cursor: pointer; font-size: 0.88rem;">
            💡 ¿Por qué en la Forma Canónica el signo cambia a $${flippedSummaryText}$ con $${flippedVarsText} \\ge 0$? (Simétrico vs. Asimétrico)
        </summary>
        <div style="margin-top: 8px; font-size: 0.85rem; line-height: 1.5; color: #cbd5e1;">
            • <b>Dual Simétrico (Metodología de la Cátedra - Diap. 23 a 26 de DUAL):</b> Al multiplicar las restricciones no canónicas por $-1$, los coeficientes y términos independientes invierten su signo. Todas las variables duales resultan no negativas ($y_i \\ge 0$), lo que permite resolver el Dual directamente mediante el Método Simplex.<br>
            ${flippedRowsDetails}<br>
            • <b>Dual Asimétrico (Regla General):</b> Si se mantuviese la desigualdad original en sentido opuesto, la regla general asume variables duales no positivas ($y_i \\le 0$). Al efectuar el cambio de variable estándar $y_i' = -y_i \\ge 0$, se obtiene exactamente la misma formulación.<br>
            • Ambas formas son matemáticamente equivalentes, pero la cátedra enseña el pasaje canónico para trabajar siempre con variables no negativas.
        </div>
    </details>`;
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
        <div ref={panelRef} className="card-panel" style={{ borderLeft: '4px solid var(--accent-dual)', marginTop: '20px' }}>
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

            {/* Single cohesive equation-box with all equations formatted */}
            <div
                className="equation-box"
                dangerouslySetInnerHTML={{ __html: renderLatexInHtml(dualHtml) }}
                style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
            />

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
                <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border)', paddingTop: '20px' }}>
                    <SimplexPanel
                        simplexResult={dualSimplexResult}
                        isDualSimplex={true}
                        primalOptZ={primalOptZ}
                        onClose={() => setDualSimplexResult(null)}
                    />
                </div>
            )}
        </div>
    );
}
