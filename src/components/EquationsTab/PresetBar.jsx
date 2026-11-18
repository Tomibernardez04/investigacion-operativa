import React, { useState } from 'react';
import { PRESETS } from '../../data/presets.js';

export default function PresetBar({ activePresetId, onLoadPreset }) {
    const [category, setCategory] = useState('curso'); // 'curso' | 'casos'

    const cursoPresets = [
        { id: 'slides_metal', label: 'Diapos 37-45: Taller Metalúrgico (Máx)' },
        { id: 'casos_particulares_alt', label: 'Diapo 20: Soluciones Alternativas (0*)' },
        { id: 'ex_4_2', label: 'Ejercicio 4.2 ➔ 5.6 (Máx, 3 variables)' },
        { id: 'ex_4_9', label: 'Ejercicio 4.9 ➔ 5.8 (Máx, 2 variables)' },
        { id: 'ex_4_12', label: 'Ejercicio 4.12 ➔ 5.9 (Mín: ≥, ≤)' },
        { id: 'slides_min', label: 'Diapos 52-57: Minimización (Mín: ≤, ≥, =)' }
    ];

    const casosPresets = [
        { id: 'caso_factible', label: '✅ 1. Factible Estándar (Única)' },
        { id: 'caso_alternativas', label: '🔄 2. Soluciones Alternativas (0*)' },
        { id: 'caso_degenerada', label: '⚡ 3. Solución Degenerada (Triple)' },
        { id: 'caso_incompatible', label: '❌ 4. Incompatible (R = ∅)' },
        { id: 'caso_no_acotado', label: '🚀 5. Polígono Abierto (No Acotado)' }
    ];

    return (
        <section className="preset-bar" style={{
            marginBottom: '14px',
            background: 'rgba(19, 27, 46, 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        📁 Cargar Ejemplos:
                    </span>
                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(11, 15, 25, 0.8)',
                        padding: '2px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.78rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => setCategory('curso')}
                            style={{
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: category === 'curso' ? 'var(--primary)' : 'transparent',
                                color: category === 'curso' ? '#041019' : 'var(--text-muted)',
                                fontWeight: category === 'curso' ? 700 : 600
                            }}
                        >
                            📚 Diapos Cátedra (6)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategory('casos')}
                            style={{
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: category === 'casos' ? 'var(--primary)' : 'transparent',
                                color: category === 'casos' ? '#041019' : 'var(--text-muted)',
                                fontWeight: category === 'casos' ? 700 : 600
                            }}
                        >
                            🎯 Casos Especiales 2D (5)
                        </button>
                    </div>
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Carga automática de modelo y resolución
                </span>
            </div>

            {category === 'curso' ? (
                <div className="preset-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {cursoPresets.map(p => (
                        <button
                            key={p.id}
                            className={`btn-preset ${activePresetId === p.id ? 'active' : ''}`}
                            onClick={() => onLoadPreset(p.id)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="preset-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {casosPresets.map(p => (
                        <button
                            key={p.id}
                            className={`btn-preset ${activePresetId === p.id ? 'active' : ''}`}
                            onClick={() => onLoadPreset(p.id)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
