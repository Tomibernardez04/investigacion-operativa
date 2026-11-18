import React, { useState, useRef, useEffect } from 'react';
import MathView from '../MathView.jsx';
import { solveDual } from '../../logic/primalDual.js';
import { formatVarMath } from '../../logic/math.js';
import { renderLatexInHtml } from '../../logic/katexHelper.js';

export default function EmbeddedDualStepperPanel({
    primalData,
    onClose
}) {
    const [step, setStep] = useState(0);
    const totalSteps = 6;
    const panelRef = useRef(null);

    useEffect(() => {
        if (panelRef.current && typeof panelRef.current.scrollIntoView === 'function') {
            panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [primalData]);

    if (!primalData) return null;
    const dual = solveDual(primalData);
    if (!dual) return null;

    const zVal = primalData.Z ? primalData.Z.toTex() : '0';
    const wVal = (step >= 1) ? dual.W.toTex() : '---';

    const stepTitles = [
        'Tabla Óptima Primal y Mapeo',
        'Traslado del Funcional Óptimo',
        'Base Dual e Identificación de Costos ck',
        'Columnas Identidad de la Base Dual',
        'Matriz Interna Negativa Transpuesta',
        'Indicadores Netos y Optimalidad Dual',
        'Correlación y Teorema Fundamental de la Dualidad'
    ];

    // Compute status flags for Step 6
    const degPrimalVars = (primalData.base || [])
        .filter(b => b.B && typeof b.B.isZero === 'function' && b.B.isZero())
        .map(b => formatVarMath(b.var));
    const isPrimalDegenerate = degPrimalVars.length > 0;

    const altPrimalVars = [];
    (primalData.varNames || []).forEach((v, idx) => {
        const inBase = (primalData.base || []).some(b => b.var && b.var.trim().toLowerCase() === v.trim().toLowerCase());
        if (!inBase && primalData.zj_cj && primalData.zj_cj[idx] && typeof primalData.zj_cj[idx].isZero === 'function' && primalData.zj_cj[idx].isZero()) {
            altPrimalVars.push(formatVarMath(v));
        }
    });
    const isPrimalAlternative = (altPrimalVars.length > 0) || (primalData.verdict && primalData.verdict.includes('ALT'));

    const altDualVars = (dual.dualNB || [])
        .filter(dnb => dnb.primalBVal && typeof dnb.primalBVal.isZero === 'function' && dnb.primalBVal.isZero())
        .map(dnb => formatVarMath(dnb.dualVar));

    const degDualVars = (dual.dualBase || [])
        .filter(db => db.B && typeof db.B.isZero === 'function' && db.B.isZero())
        .map(db => formatVarMath(db.dualVar));

    const getStepExplanation = () => {
        const nbVarsStr = dual.dualBase.map(d => `${formatVarMath(d.primalNBVar)} \\to ${formatVarMath(d.dualVar)}`).join(', ');
        const bValsStr = dual.dualBase.map(d => `${formatVarMath(d.dualVar)} = ${d.B.toTex()}`).join(', ');
        const bPrimalStr = dual.dualNB.map(d => `${formatVarMath(d.primalBVar)} = ${d.primalBVal.toTex()}`).join(', ');

        const m = primalData.origResources ? primalData.origResources.length : 0;
        const ckDetails = dual.dualBase.map(d => {
            const match = d.dualVar.match(/y_?\{?(\d+)\}?/);
            const k = match ? parseInt(match[1], 10) : 0;
            if (k >= 1 && k <= m) {
                return `<b>${formatVarMath(d.dualVar)}</b>: $c_k = b_{${k}} = ${d.ck.toTex()}$ (término independiente RHS de la restricción $R_{${k}}$ del directo)`;
            } else {
                return `<b>${formatVarMath(d.dualVar)}</b>: $c_k = 0$ (variable dual de exceso/holgura, costo nulo en el funcional $W$)`;
            }
        }).join('<br>• ');

        switch (step) {
            case 0:
                return `Observá la <b>Tabla Óptima Primal</b>. Debajo de cada columna se rotulan las variables duales correspondientes: las holguras corresponden a las variables duales principales ($y_1, y_2, \\dots$), y las de decisión corresponden a los excesos duales.`;
            case 1:
                return `Por el <b>Teorema Fundamental de la Dualidad</b>, el funcional óptimo se mantiene idéntico: $Z_{\\text{ópt}} = W_{\\text{ópt}}$. Trasladamos directamente el valor <b>Z = ${zVal}</b> al funcional dual <b>W = ${zVal}</b> (ver Diapo 39).`;
            case 2:
                return `<b>1. Variables de la Base Dual ($y_k$ y $B$):</b><br>` +
                    `Las variables <b>no básicas del Primal</b> (${nbVarsStr}) ingresan a la <b>base del Dual</b> (Diapos 40-41). Sus valores en la columna $B$ son exactamente sus indicadores netos $z_j - c_j$: <b>${bValsStr}</b>.<br><br>` +
                    `<b>2. Origen de la Columna de Costos ($c_k$):</b><br>` +
                    `En el funcional Dual ($W = \\sum b_i y_i$), los costos unitarios provienen directamente del vector de recursos originales (<b>RHS $b_i$</b>) de las restricciones del Primal:<br>` +
                    `• ${ckDetails}<br><br>` +
                    `<span style="color: var(--primary);">💡 <b>Regla de la Cátedra (Diapo 41):</b> Toda variable dual $y_i$ asociada a una restricción $R_i$ toma como costo $c_k$ el término independiente $b_i$ de esa restricción. Las variables de exceso/holgura duales tienen costo $0$.</span>`;
            case 3:
                return `Toda variable que entra a la base dual genera una <b>columna de la matriz identidad</b> ($1$ en su fila correspondiente y $0$ en las demás) y su indicador neto en la última fila es exactamente <b>0</b> (ver Diapo 42).`;
            case 4:
                return `La submatriz interna se calcula mediante la transposición y cambio de signo: <b>$\\bar{A}_{\\text{dual}} = -\\bar{A}_{\\text{primal}}^T$</b>. Es decir, <i>la fila del directo se convierte en columna del dual con signo invertido $(-1)$</i> (Diapos 43-44).`;
            case 5:
                const isDualMin = (dual.dualSense === 'MIN' || primalData.sense === 'MAX');
                const signExpl = isDualMin
                    ? 'con <b>signo invertido</b> (porque el Dual es de Minimización). Todos quedan $\\le 0$'
                    : 'con <b>signo positivo</b> (porque el Dual es de Maximización). Todos quedan $\\ge 0$';
                return `Los valores del vector $B$ del directo (${bPrimalStr}) pasan a la fila $z_j - c_j$ del dual ${signExpl}, confirmando la <b>Optimalidad del Dual</b> (Diapo 45).`;
            case 6:
                let caseSpecificCallout = '';
                if (isPrimalDegenerate) {
                    caseSpecificCallout = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(249, 115, 22, 0.15); border-left: 3px solid #f97316; border-radius: 4px;">` +
                        `⚡ <b>Diagnóstico Específico del Problema (Degenerada ➔ Alternativa):</b><br>` +
                        `• <b>Directo (Primal):</b> Solución Óptima Degenerada. La variable básica <b>${degPrimalVars.join(', ')}</b> tiene recurso $B = 0$ (vértice redundante o punto triple).<br>` +
                        `• <b>Dual:</b> Por la regla de pasaje de signos ($z_j - c_j = \\mp B$), la variable dual no básica <b>${altDualVars.join(', ')}</b> presenta costo reducido neto <b>$0^*$</b> ($z_j - c_j = 0$). Consecuentemente, el Dual posee <b>infinitas Soluciones Alternativas Múltiples</b> con idéntico funcional $W^* = ${dual.W ? dual.W.toTex() : zVal}$.` +
                        `</div>`;
                } else if (isPrimalAlternative) {
                    caseSpecificCallout = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(59, 130, 246, 0.15); border-left: 3px solid #3b82f6; border-radius: 4px;">` +
                        `🔄 <b>Diagnóstico Específico del Problema (Alternativa ➔ Degenerada):</b><br>` +
                        `• <b>Directo (Primal):</b> Soluciones Múltiples (Alternativas) con indicador neto $0^*$ en la variable no básica <b>${altPrimalVars.join(', ')}</b>.<br>` +
                        `• <b>Dual:</b> Por la regla de pasaje ($B_{\\text{dual}} = \\pm(z_j - c_j)$), la variable básica del dual <b>${degDualVars.join(', ')}</b> toma recurso <b>$B = 0$</b> en la base, determinando una <b>Solución Óptima Degenerada</b> en el Dual.` +
                        `</div>`;
                } else {
                    caseSpecificCallout = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(16, 185, 129, 0.15); border-left: 3px solid #10b981; border-radius: 4px;">` +
                        `✅ <b>Diagnóstico Específico del Problema (Finita Estándar Única):</b><br>` +
                        `Ambos modelos convergen en un único punto extremo factible con igual funcional óptimo finito ($Z^* = W^* = ${zVal}$). Los multiplicadores sombra en la fila $z_j - c_j$ del Dual reflejan con exactitud los recursos $B$ del directo.` +
                        `</div>`;
                }

                return `<b>Diagnóstico de Solución y Teorema Fundamental de la Dualidad (Diapo 58):</b><br><br>` +
                    `El <b>Teorema Fundamental de la Dualidad</b> establece la correspondencia directa e indiscutible entre el problema Directo y su Dual:<br>` +
                    `• <b>Directa Finita $\\iff$ Dual Finita:</b> Al ser la solución óptima del Primal finita ($Z = ${zVal}$), el Dual alcanza obligatoriamente el mismo óptimo finito ($W = ${zVal}$), verificando la dualidad fuerte $Z_{\\text{ópt}} = W_{\\text{ópt}}$.<br>` +
                    `• <b>Degenerada $\\iff$ Alternativa:</b> Si el problema directo presenta degeneración (variable básica con $B = 0$ o empate en ratios $\\theta$), el dual presenta soluciones múltiples o alternativas ($z_j - c_j = 0$ en variable no básica), y viceversa.<br>` +
                    `• <b>Incompatible $\\iff$ Poliedro Abierto (No Acotada):</b> Si uno de los problemas no tiene solución factible, el otro puede mejorar indefinidamente.<br>` +
                    caseSpecificCallout;
            default:
                return '';
        }
    };

    // Step 6 Verdict Card content
    let primalStatusText = primalData.title || 'Solución Óptima Única Factible';
    let dualStatusText = 'Solución Óptima Finita Confirmada';
    let dualBadgeClass = 'optimal';
    let dualBadgeText = '⚖️ Correlación del Teorema Fundamental de la Dualidad (Diapo 58)';
    let explanationFooter = '';

    if (isPrimalDegenerate) {
        primalStatusText = `Solución Óptima Degenerada (${degPrimalVars.join(', ')} con B = 0)`;
        dualStatusText = `Soluciones Alternativas (Múltiples) Confirmada (${altDualVars.join(', ')} con 0*)`;
        dualBadgeClass = 'alternative';
        dualBadgeText = '🔄 Teorema Fundamental: Primal Degenerado ➔ Dual con Soluciones Alternativas';
        explanationFooter = `<b>⚖️ Teorema Fundamental de la Dualidad (Diapo 58 - Correspondencia Degenerada ➔ Alternativa):</b><br>` +
            `• <b>Problema Directo Degenerado:</b> La variable básica <b>${degPrimalVars.join(', ')}</b> tiene recurso $B = 0$ (vértice redundante o punto triple).<br>` +
            `• <b>Problema Dual con Soluciones Alternativas:</b> Por la regla de pasaje de signos ($z_j - c_j = \\mp B$), la variable dual no básica <b>${altDualVars.join(', ')}</b> presenta costo reducido <b>$0^*$</b> ($z_j - c_j = 0$). ` +
            `Esto confirma formalmente la existencia de <b>infinitas soluciones óptimas alternativas en el Dual</b> con idéntico funcional $W^* = ${dual.W ? dual.W.toTex() : zVal}$.`;
    } else if (isPrimalAlternative) {
        primalStatusText = `Soluciones Múltiples (Alternativas) (${altPrimalVars.join(', ')} con 0*)`;
        dualStatusText = `Solución Óptima Degenerada Confirmada (${degDualVars.join(', ')} con B = 0)`;
        dualBadgeClass = 'warning';
        dualBadgeText = '⚡ Teorema Fundamental: Primal Alternativo ➔ Dual Degenerado';
        explanationFooter = `<b>⚖️ Teorema Fundamental de la Dualidad (Diapo 58 - Correspondencia Alternativa ➔ Degenerada):</b><br>` +
            `• <b>Problema Directo con Soluciones Alternativas:</b> La variable no básica <b>${altPrimalVars.join(', ')}</b> tiene costo reducido $0^*$ ($z_j - c_j = 0$).<br>` +
            `• <b>Problema Dual Degenerado:</b> Por la regla de pasaje ($B_{\\text{dual}} = \\pm(z_j - c_j)$), la variable básica del dual <b>${degDualVars.join(', ')}</b> toma <b>$B = 0$</b> en la base, generando una solución degenerada en el Dual.`;
    } else {
        primalStatusText = 'Solución Óptima Única Factible';
        dualStatusText = 'Solución Óptima Única Factible Confirmada';
        dualBadgeClass = 'optimal';
        dualBadgeText = '⚖️ Correlación del Teorema Fundamental de la Dualidad (Diapo 58)';
        explanationFooter = `<b>Cumplimiento del Teorema de Dualidad Fuerte:</b> Como el Primal es finito y factible con $Z^* = ${zVal}$, el Dual alcanza idéntico óptimo finito $W^* = ${dual.W ? dual.W.toTex() : zVal}$. Los multiplicadores sombra en la fila $z_j - c_j$ del Dual reflejan con exactitud las variables directas $B$.`;
    }

    return (
        <div ref={panelRef} className="card-panel" style={{ borderLeft: '4px solid var(--accent-step)', marginTop: '20px' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="badge-type badge-dual">PASO A PASO DUAL</span>
                    <span className="step-badge">Paso {step} de {totalSteps}</span>
                    <span style={{ fontWeight: 700 }}>{stepTitles[step]}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-step" onClick={() => setStep(0)} disabled={step === 0}>⏮ Inicio</button>
                    <button className="btn-step" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>◀ Anterior</button>
                    <button className="btn-step" onClick={() => setStep(s => Math.min(totalSteps, s + 1))} disabled={step === totalSteps}>Siguiente ▶</button>
                    <button className="btn-step" onClick={() => setStep(totalSteps)} disabled={step === totalSteps}>⏭ Fin</button>
                    <button className="btn-step" onClick={() => setStep(0)}>↺ Reiniciar</button>
                    {onClose && (
                        <button
                            className="btn-step"
                            onClick={onClose}
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                            ✕ Ocultar
                        </button>
                    )}
                </div>
            </div>

            {/* Step Explanation rendered with KaTeX */}
            <div
                className="step-explanation"
                dangerouslySetInnerHTML={{ __html: renderLatexInHtml(getStepExplanation()) }}
                style={{ marginBottom: '16px' }}
            />

            {/* Side by side tables */}
            <div className="stepper-tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                {/* Primal Table */}
                <div className="table-card primal-card">
                    <div className="table-card-header">
                        <span className="badge-type badge-primal">DIRECTA ÓPTIMA</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                            Z = {zVal}
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
                                        <tr key={`p-base-${rIdx}`}>
                                            <td><MathView math={bRow.ck.toTex()} /></td>
                                            <td className="cell-base"><MathView math={bRow.var} /></td>
                                            <td className={`cell-b ${isDegPrimalB ? 'hl-degenerate' : (step === 5 ? 'hl-target' : '')}`}>
                                                {isDegPrimalB ? (
                                                    <b className="deg-zero-simple" title="Solución óptima degenerada: variable básica con B = 0">0</b>
                                                ) : (
                                                    <MathView math={bRow.B.toTex()} />
                                                )}
                                            </td>
                                            {bRow.row.map((cell, cIdx) => {
                                                const isPrimalNB = !primalData.base.some(b => b.var.trim().toLowerCase() === primalData.varNames[cIdx].trim().toLowerCase());
                                                const hlCell = (step === 4 && isPrimalNB) ? 'hl-target' : '';
                                                return (
                                                    <td key={`p-cell-${rIdx}-${cIdx}`} className={hlCell}>
                                                        <MathView math={cell.toTex()} />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                <tr className="zj-row">
                                    <td></td>
                                    <td><MathView math="z_j - c_j" /></td>
                                    <td className={step === 1 ? 'hl-target' : ''}>
                                        <b><MathView math={zVal} /></b>
                                    </td>
                                    {primalData.zj_cj.map((val, idx) => {
                                        const isPrimalNB = !primalData.base.some(b => b.var.trim().toLowerCase() === primalData.varNames[idx].trim().toLowerCase());
                                        const hlZj = (step === 2 && isPrimalNB) ? 'hl-target' : '';
                                        const isAltZero = isPrimalNB && typeof val.isZero === 'function' && val.isZero();
                                        return (
                                            <td key={`pzj-${idx}`} className={hlZj}>
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

                {/* Dual Table (Step by step reveal) */}
                <div className="table-card dual-card">
                    <div className="table-card-header">
                        <span className="badge-type badge-dual">DUAL ÓPTIMA (CONSTRUCCIÓN)</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-dual)' }}>
                            W = {wVal}
                        </span>
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
                                {dual.dualBase.map((dbRow, rIdx) => {
                                    const ckVal = (step >= 2) ? dbRow.ck.toTex() : '---';
                                    const ykVal = (step >= 2) ? dbRow.dualVar : '---';
                                    const isDegDualB = (step >= 2) && dbRow.B && typeof dbRow.B.isZero === 'function' && dbRow.B.isZero();
                                    const bVal = (step >= 2) ? dbRow.B.toTex() : '---';

                                    let hlB = (step === 2) ? 'hl-target' : '';
                                    if (isDegDualB) {
                                        hlB = (hlB ? hlB + ' ' : '') + 'hl-degenerate';
                                    }

                                    return (
                                        <tr key={`d-base-${rIdx}`}>
                                            <td className={step === 2 ? 'hl-target' : ''}>
                                                {ckVal === '---' ? '---' : <MathView math={ckVal} />}
                                            </td>
                                            <td className={`cell-base ${step === 2 ? 'hl-target' : ''}`}>
                                                {ykVal === '---' ? '---' : <MathView math={ykVal} />}
                                            </td>
                                            <td className={`cell-b ${hlB}`}>
                                                {isDegDualB ? (
                                                    <div className="deg-zero-pill" title="Solución dual degenerada: variable básica dual con B = 0">
                                                        <span className="deg-zero-num">0</span>
                                                        <span className="deg-zero-label">Degenerada</span>
                                                    </div>
                                                ) : (
                                                    bVal === '---' ? '---' : <MathView math={bVal} />
                                                )}
                                            </td>
                                            {dual.matrixRows[rIdx].map((cell, cIdx) => {
                                                const targetDvName = dual.dualVarNames[cIdx];
                                                const isIdentityCol = dual.dualBase.some(d => d.dualVar === targetDvName);
                                                let cellVal = '·';
                                                let cellClass = '';
                                                if (isIdentityCol) {
                                                    if (step >= 3) {
                                                        cellVal = cell.toTex();
                                                        cellClass = (step === 3) ? 'hl-identity' : '';
                                                    }
                                                } else {
                                                    if (step >= 4) {
                                                        cellVal = cell.toTex();
                                                        cellClass = (step === 4) ? 'hl-target' : '';
                                                    }
                                                }
                                                return (
                                                    <td key={`d-cell-${rIdx}-${cIdx}`} className={cellClass}>
                                                        {cellVal === '·' ? '·' : <MathView math={cellVal} />}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                <tr className="zj-row">
                                    <td></td>
                                    <td><MathView math="z_j - c_j" /></td>
                                    <td className={step === 1 ? 'hl-target' : ''}>
                                        <b>{wVal === '---' ? '---' : <MathView math={wVal} />}</b>
                                    </td>
                                    {dual.zj_cj.map((val, idx) => {
                                        const targetDvName = dual.dualVarNames[idx];
                                        const isBase = dual.dualBase.some(d => d.dualVar === targetDvName);
                                        let cellVal = '·';
                                        let cellClass = '';
                                        let isAltPill = false;

                                        if (isBase) {
                                            if (step >= 3) {
                                                cellVal = '0';
                                                cellClass = (step === 3) ? 'hl-identity' : '';
                                            }
                                        } else {
                                            if (step >= 5) {
                                                if (typeof val.isZero === 'function' && val.isZero()) {
                                                    isAltPill = true;
                                                    cellClass = 'hl-alt-zero';
                                                } else {
                                                    cellVal = val.toTex();
                                                    cellClass = (step === 5) ? 'hl-target' : '';
                                                }
                                            }
                                        }

                                        return (
                                            <td key={`dzj-${idx}`} className={cellClass}>
                                                {isAltPill ? (
                                                    <div className="alt-zero-pill" title="Solución alternativa: indicador zj - cj = 0* en variable no básica">
                                                        <span className="alt-zero-num">0*</span>
                                                        <span className="alt-zero-label">Sol. Alternativa</span>
                                                    </div>
                                                ) : (
                                                    <b>{cellVal === '·' ? '·' : <MathView math={cellVal} />}</b>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Step 6 Verdict Card (Exactly matching Verificador_Pasaje_Primal_Dual.html) */}
            {step === 6 && (
                <div className="verdict-card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <span className={`verdict-badge ${dualBadgeClass}`}>{dualBadgeText}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-dual)', fontSize: '1.1rem' }}>
                            Z* = W* = {zVal}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '10px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)' }}>
                            <b style={{ color: 'var(--primary)' }}>Problema Directo (Primal):</b><br />
                            • Estado: <b>{primalStatusText}</b><br />
                            • Valor Óptimo: <b>Z* = {zVal}</b>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.3)' }}>
                            <b style={{ color: 'var(--accent-dual)' }}>Problema Dual:</b><br />
                            • Estado: <b>{dualStatusText}</b><br />
                            • Valor Óptimo: <b>W* = {dual.W ? dual.W.toTex() : zVal}</b>
                        </div>
                    </div>
                    <div
                        dangerouslySetInnerHTML={{ __html: renderLatexInHtml(explanationFooter) }}
                        style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '10px' }}
                    />
                </div>
            )}
        </div>
    );
}
