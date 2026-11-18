import React from 'react';
import MathView from './MathView.jsx';

export default function TheoryTab() {
    return (
        <div className="tab-view active">
            <div className="cheatsheet-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Card 1: Sign Rules */}
                <div className="rule-card card-panel">
                    <div className="rule-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '12px' }}>
                        📌 Diapos 46-51: Reglas de Signos del Pasaje de Tablas
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="rule-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ width: '25%', padding: '10px' }}>Elemento</th>
                                    <th style={{ width: '37.5%', padding: '10px' }}>Directo Máx ➔ Dual Mín</th>
                                    <th style={{ width: '37.5%', padding: '10px' }}>Directo Mín ➔ Dual Máx</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px' }}><b>Funcional Óptimo</b></td>
                                    <td style={{ padding: '10px' }}>
                                        <MathView math="W_{\text{ópt}} = Z_{\text{ópt}}" /> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(mismo valor numérico)</span>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <MathView math="W_{\text{ópt}} = Z_{\text{ópt}}" /> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(mismo valor numérico)</span>
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px' }}>
                                        <b>Base Dual (<MathView math="B_{\text{dual}}" />)</b>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        Toma <MathView math="(z_j - c_j)_{\text{primal}}" /> con signo <span style={{ display: 'inline-block', padding: '1px 7px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>+</span>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        Toma <MathView math="(z_j - c_j)_{\text{primal}}" /> con signo <span style={{ display: 'inline-block', padding: '1px 7px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>-</span>
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px' }}>
                                        <b>Fila <MathView math="z_j - c_j" /> Dual</b>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        Toma <MathView math="B_{\text{primal}}" /> con signo <span style={{ display: 'inline-block', padding: '1px 7px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>-</span>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        Toma <MathView math="B_{\text{primal}}" /> con signo <span style={{ display: 'inline-block', padding: '1px 7px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>+</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px' }}><b>Matriz Interna</b></td>
                                    <td style={{ padding: '10px' }}>
                                        <MathView math="\bar{A}_{\text{dual}} = -\bar{A}_{\text{primal}}^T" /> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(traspuesta cambiada de signo)</span>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <MathView math="\bar{A}_{\text{dual}} = -\bar{A}_{\text{primal}}^T" /> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(traspuesta cambiada de signo)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards 2 & 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    <div className="rule-card card-panel">
                        <div className="rule-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '12px' }}>
                            ⚖️ Diapo 58-59: Teorema Fundamental de la Dualidad
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="rule-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ width: '50%', padding: '8px' }}>Problema Directo</th>
                                        <th style={{ width: '50%', padding: '8px' }}>Problema Dual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px' }}><b>Solución Óptima Finita</b></td>
                                        <td style={{ padding: '8px' }}><b>Solución Óptima Finita</b> (<MathView math="Z^* = W^*" />)</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px' }}><b>Solución Degenerada</b></td>
                                        <td style={{ padding: '8px' }}><b>Soluciones Alternativas</b> (múltiples)</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px' }}><b>Soluciones Alternativas</b></td>
                                        <td style={{ padding: '8px' }}><b>Solución Degenerada</b></td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px' }}><b>Problema Incompatible</b></td>
                                        <td style={{ padding: '8px' }}><b>Poliedro Abierto</b> (No acotado)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rule-card card-panel">
                        <div className="rule-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-dual)', marginBottom: '12px' }}>
                            💡 ¿De dónde sale la columna $c_k$ del Dual?
                        </div>
                        <ul style={{ fontSize: '0.88rem', paddingLeft: '20px', color: 'var(--text-main)', lineHeight: 1.8, margin: 0 }}>
                            <li>
                                <b>Variables Principales <MathView math="y_i" /></b> (asociadas a la $i$-ésima restricción del directo):<br />
                                Su costo <MathView math="c_k" /> es el <b>recurso <MathView math="b_i" /> original del primal</b>.
                            </li>
                            <li style={{ marginTop: '10px' }}>
                                <b>Variables de Exceso <MathView math="y_{m+j}" /></b> (asociadas a la variable de decisión <MathView math="x_j" />):<br />
                                Su costo <MathView math="c_k" /> en el dual es <b>0</b> (por ser variable de holgura/exceso en el dual).
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
