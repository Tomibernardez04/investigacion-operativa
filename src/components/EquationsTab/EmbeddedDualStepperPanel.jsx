import React, { useState } from 'react';
import MathView from '../MathView.jsx';
import { solveDual } from '../../logic/primalDual.js';
import { formatVarMath } from '../../logic/math.js';

export default function EmbeddedDualStepperPanel({
    primalData,
    onClose
}) {
    const [step, setStep] = useState(0);
    const totalSteps = 6;

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

    const getExplanation = () => {
        const nbVarsStr = dual.dualBase.map(d => `${d.primalNBVar} \\to ${d.dualVar}`).join(', ');
        const bValsStr = dual.dualBase.map(d => `${d.dualVar} = ${d.B.toTex()}`).join(', ');
        const bPrimalStr = dual.dualNB.map(d => `${d.primalBVar} = ${d.primalBVal.toTex()}`).join(', ');

        const m = primalData.origResources ? primalData.origResources.length : 0;
        const ckDetails = dual.dualBase.map(d => {
            const match = d.dualVar.match(/y_?\{?(\d+)\}?/);
            const k = match ? parseInt(match[1], 10) : 0;
            if (k >= 1 && k <= m) {
                return `<b>${d.dualVar}</b>: $c_k = b_{${k}} = ${d.ck.toTex()}$ (término independiente RHS de la restricción R_{${k}} del directo)`;
            } else {
                return `<b>${d.dualVar}</b>: $c_k = 0$ (variable dual de exceso/holgura, costo nulo en W)`;
            }
        }).join('<br>• ');

        switch (step) {
            case 0:
                return `Observá la <b>Tabla Óptima Primal</b>. Debajo de cada columna se rotulan las variables duales correspondientes: las holguras corresponden a las variables duales principales ($y_1, y_2, \\dots$), y las de decisión corresponden a los excesos duales.`;
            case 1:
                return `Por el <b>Teorema Fundamental de la Dualidad</b>, el funcional óptimo se mantiene idéntico: $Z_{\\text{ópt}} = W_{\\text{ópt}}$. Trasladamos directamente el valor <b>Z = ${zVal}</b> al funcional dual <b>W = ${zVal}</b>.`;
            case 2:
                return `<b>1. Variables de la Base Dual ($y_k$ y $B$):</b><br>` +
                    `Las variables <b>no básicas del Primal</b> (${nbVarsStr}) ingresan a la <b>base del Dual</b>. Sus valores en la columna $B$ son exactamente sus indicadores netos $z_j - c_j$: <b>${bValsStr}</b>.<br><br>` +
                    `<b>2. Origen de la Columna de Costos ($c_k$):</b><br>` +
                    `En el funcional Dual ($W = \\sum b_i y_i$), los costos provienen directamente del vector de recursos originales (<b>RHS $b_i$</b>) del Primal:<br>` +
                    `• ${ckDetails}<br><br>` +
                    `💡 <b>Regla:</b> Toda variable dual $y_i$ asociada a una restricción $R_i$ toma como costo $c_k$ el término independiente $b_i$ de esa restricción. Las de exceso/holgura tienen costo $0$.`;
            case 3:
                return `Toda variable que entra a la base dual genera una <b>columna de la matriz identidad</b> ($1$ en su fila correspondiente y $0$ en las demás) y su indicador neto en la última fila es exactamente <b>0</b>.`;
            case 4:
                return `La submatriz interna se calcula mediante transposición y cambio de signo: <b>$\\bar{A}_{\\text{dual}} = -\\bar{A}_{\\text{primal}}^T$</b>. Es decir, <i>la fila del directo se convierte en columna del dual con signo invertido $(-1)$</i>.`;
            case 5:
                const isDualMin = (dual.dualSense === 'MIN' || primalData.sense === 'MAX');
                const signExpl = isDualMin
                    ? 'con <b>signo invertido</b> (porque el Dual es de Minimización). Todos quedan $\\le 0$'
                    : 'con <b>signo positivo</b> (porque el Dual es de Maximización). Todos quedan $\\ge 0$';
                return `Los valores del vector $B$ del directo (${bPrimalStr}) pasan a la fila $z_j - c_j$ del dual ${signExpl}, confirmando la <b>Optimalidad del Dual</b>.`;
            case 6:
                return `<b>Diagnóstico de Solución y Teorema Fundamental de la Dualidad:</b><br><br>` +
                    `• <b>Directa Finita $\\iff$ Dual Finita:</b> Al ser la solución óptima del Primal finita ($Z = ${zVal}$), el Dual alcanza obligatoriamente el mismo óptimo finito ($W = ${zVal}$).<br>` +
                    `• <b>Degenerada $\\iff$ Alternativa:</b> Si el problema directo presenta degeneración (variable básica con $B = 0$), el dual presenta soluciones múltiples o alternativas ($z_j - c_j = 0$ en variable no básica), y viceversa.`;
            default:
                return '';
        }
    };

    return (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-step)', marginTop: '20px' }}>
            {/* Header */}
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

            {/* Step Explanation */}
            <div
                className="step-explanation"
                dangerouslySetInnerHTML={{ __html: getExplanation() }}
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
                                    <th>$c_k$</th><th>$x_k$</th><th>$B$</th>
                                    {primalData.varNames.map((v, i) => {
                                        const dv = primalData.dualVarNames[i] || (`y${i + 1}`);
                                        return (
                                            <th key={`pv-${i}`}>
                                                <MathView math={v} />
                                                <span className="col-dual-mapping" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-dual)' }}>
                                                    <MathView math={dv} />
                                                </span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {primalData.base.map((bRow, rIdx) => (
                                    <tr key={`p-base-${rIdx}`}>
                                        <td><MathView math={bRow.ck.toTex()} /></td>
                                        <td className="cell-base"><MathView math={bRow.var} /></td>
                                        <td className={`cell-b ${step === 5 ? 'hl-target' : ''}`}>
                                            <MathView math={bRow.B.toTex()} />
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
                                ))}
                                <tr className="zj-row">
                                    <td></td><td>$z_j - c_j$</td>
                                    <td className={step === 1 ? 'hl-target' : ''}>
                                        <b><MathView math={zVal} /></b>
                                    </td>
                                    {primalData.zj_cj.map((val, idx) => {
                                        const isPrimalNB = !primalData.base.some(b => b.var.trim().toLowerCase() === primalData.varNames[idx].trim().toLowerCase());
                                        const hlZj = (step === 2 && isPrimalNB) ? 'hl-target' : '';
                                        return (
                                            <td key={`pzj-${idx}`} className={hlZj}>
                                                <b><MathView math={val.toTex()} /></b>
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
                                    <th>$c_k$</th><th>$y_k$</th><th>$B$</th>
                                    {dual.dualVarNames.map((dv, i) => (
                                        <th key={`dv-${i}`}><MathView math={dv} /></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dual.dualBase.map((dbRow, rIdx) => {
                                    const ckVal = (step >= 2) ? dbRow.ck.toTex() : '---';
                                    const ykVal = (step >= 2) ? dbRow.dualVar : '---';
                                    const bVal = (step >= 2) ? dbRow.B.toTex() : '---';
                                    return (
                                        <tr key={`d-base-${rIdx}`}>
                                            <td className={step === 2 ? 'hl-target' : ''}>
                                                {ckVal === '---' ? '---' : <MathView math={ckVal} />}
                                            </td>
                                            <td className={`cell-base ${step === 2 ? 'hl-target' : ''}`}>
                                                {ykVal === '---' ? '---' : <MathView math={ykVal} />}
                                            </td>
                                            <td className={`cell-b ${step === 2 ? 'hl-target' : ''}`}>
                                                {bVal === '---' ? '---' : <MathView math={bVal} />}
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
                                    <td></td><td>$z_j - c_j$</td>
                                    <td className={step === 1 ? 'hl-target' : ''}>
                                        <b>{wVal === '---' ? '---' : <MathView math={wVal} />}</b>
                                    </td>
                                    {dual.zj_cj.map((val, idx) => {
                                        const targetDvName = dual.dualVarNames[idx];
                                        const isBase = dual.dualBase.some(d => d.dualVar === targetDvName);
                                        let cellVal = '·';
                                        let cellClass = '';
                                        if (isBase) {
                                            if (step >= 3) {
                                                cellVal = '0';
                                                cellClass = (step === 3) ? 'hl-identity' : '';
                                            }
                                        } else {
                                            if (step >= 5) {
                                                cellVal = val.toTex();
                                                cellClass = (step === 5) ? 'hl-target' : '';
                                            }
                                        }
                                        return (
                                            <td key={`dzj-${idx}`} className={cellClass}>
                                                <b>{cellVal === '·' ? '·' : <MathView math={cellVal} />}</b>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
