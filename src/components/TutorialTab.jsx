import React, { useState } from 'react';
import EmbeddedDualStepperPanel from './EquationsTab/EmbeddedDualStepperPanel.jsx';
import { PRESETS } from '../data/presets.js';

export default function TutorialTab() {
    const [selectedPresetKey, setSelectedPresetKey] = useState('slides_metal');
    const primalData = PRESETS[selectedPresetKey];

    return (
        <div className="tab-view active">
            <div className="card-panel" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                            🎬 Tutorial Paso a Paso: De la Tabla Primal a la Tabla Dual
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            Observá la construcción guiada de la tabla dual óptima a partir de la tabla simplex primal directa óptima cumpliendo cada regla teórica.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            Ejercicio:
                        </label>
                        <select
                            className="form-control"
                            style={{ width: 'auto' }}
                            value={selectedPresetKey}
                            onChange={(e) => setSelectedPresetKey(e.target.value)}
                        >
                            {Object.entries(PRESETS).map(([k, p]) => (
                                <option key={k} value={k}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <EmbeddedDualStepperPanel primalData={primalData} />
        </div>
    );
}
