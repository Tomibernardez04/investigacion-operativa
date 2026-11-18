import React, { useState } from 'react';
import PresetBar from './PresetBar.jsx';
import EquationBuilder from './EquationBuilder.jsx';
import SimplexPanel from './SimplexPanel.jsx';
import DualEquationsPanel from './DualEquationsPanel.jsx';
import EmbeddedDualStepperPanel from './EmbeddedDualStepperPanel.jsx';
import { PRESETS } from '../../data/presets.js';
import { solveSimplexWithHistory } from '../../logic/simplex.js';
import { Fraction, F } from '../../logic/math.js';

export default function EquationsTab() {
    const [activePresetId, setActivePresetId] = useState('slides_metal');
    const [sense, setSense] = useState('MAX');
    const [nVars, setNVars] = useState(2);
    const [nRows, setNRows] = useState(3);
    const [c, setC] = useState(['4', '3']);
    const [constraints, setConstraints] = useState([
        { coeffs: ['6', '16'], sign: '<=', rhs: '48000' },
        { coeffs: ['12', '6'], sign: '<=', rhs: '42000' },
        { coeffs: ['9', '9'], sign: '<=', rhs: '36000' }
    ]);

    // Active panel: null | 'simplex' | 'dual-eq' | 'dual-table'
    const [activePanel, setActivePanel] = useState(null);
    const [simplexResult, setSimplexResult] = useState(null);
    const [primalDataForStepper, setPrimalDataForStepper] = useState(null);

    const handleLoadPreset = (presetKey) => {
        const p = PRESETS[presetKey];
        if (!p || !p.eqCoeffs) return;
        setActivePresetId(presetKey);
        setSense(p.sense);
        const varsCount = p.eqCoeffs[0].coeffs.length;
        const rowsCount = p.eqCoeffs.length;
        setNVars(varsCount);
        setNRows(rowsCount);

        const newC = p.origCosts.slice(0, varsCount).map(val => val.toTex());
        setC(newC);

        const newConstrs = p.eqCoeffs.map(r => ({
            coeffs: r.coeffs.map(val => val.toTex()),
            sign: r.sign || '<=',
            rhs: r.rhs.toTex()
        }));
        setConstraints(newConstrs);

        // Precompute simplex result
        const solved = solveSimplexWithHistory(
            p.sense,
            p.origCosts.slice(0, varsCount),
            p.eqCoeffs.map(r => ({ coeffs: r.coeffs, sign: r.sign || '<=', rhs: r.rhs }))
        );
        setSimplexResult(solved);
        setPrimalDataForStepper(solved);
    };

    const getParsedModel = () => {
        const parsedCosts = c.slice(0, nVars).map(x => new Fraction(x));
        const parsedConstrs = constraints.slice(0, nRows).map(r => ({
            coeffs: r.coeffs.slice(0, nVars).map(x => new Fraction(x)),
            sign: r.sign,
            rhs: new Fraction(r.rhs)
        }));
        return { parsedCosts, parsedConstrs };
    };

    const handleOpenPanel = (panelName) => {
        try {
            const { parsedCosts, parsedConstrs } = getParsedModel();
            const solved = solveSimplexWithHistory(sense, parsedCosts, parsedConstrs);
            if (panelName === 'dual-table') {
                if (solved.verdict === 'INCOMPATIBLE') {
                    alert('El problema directo es Incompatible (sin solución factible). Por el Teorema Fundamental de la Dualidad, el Dual es No Acotado (Poliedro Abierto) o Incompatible.');
                    return;
                }
                if (solved.verdict === 'UNBOUNDED') {
                    alert('El problema directo es No Acotado (Poliedro Abierto). Por el Teorema Fundamental de la Dualidad, el Dual es Incompatible.');
                    return;
                }
            }
            setSimplexResult(solved);
            setPrimalDataForStepper(solved);
            setActivePanel(panelName);
        } catch (err) {
            alert(`Error al procesar: ${err.message}`);
        }
    };

    const handleClosePanel = () => {
        setActivePanel(null);
    };

    const { parsedCosts, parsedConstrs } = getParsedModel();

    return (
        <div className="tab-view active">
            <PresetBar
                activePresetId={activePresetId}
                onLoadPreset={handleLoadPreset}
            />

            <EquationBuilder
                sense={sense}
                setSense={setSense}
                nVars={nVars}
                setNVars={setNVars}
                nRows={nRows}
                setNRows={setNRows}
                c={c}
                setC={setC}
                constraints={constraints}
                setConstraints={setConstraints}
            />

            {/* Action Buttons */}
            <div className="card-panel" style={{ marginTop: '14px', paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        className="btn-action"
                        onClick={() => handleOpenPanel('simplex')}
                    >
                        ⚡ 1. Resolver Primal por Simplex (Paso a Paso)
                    </button>
                    <button
                        className="btn-action outline-btn"
                        onClick={() => handleOpenPanel('dual-eq')}
                    >
                        📝 2. Formular Ecuaciones del Dual
                    </button>
                    <button
                        className="btn-action dual-btn"
                        onClick={() => handleOpenPanel('dual-table')}
                    >
                        🎬 3. Construir Tabla Dual (Paso a Paso)
                    </button>
                </div>
            </div>

            {/* Dynamic Panels */}
            {activePanel === 'simplex' && simplexResult && (
                <SimplexPanel
                    simplexResult={simplexResult}
                    onClose={handleClosePanel}
                />
            )}

            {activePanel === 'dual-eq' && (
                <DualEquationsPanel
                    sense={sense}
                    c={parsedCosts}
                    constraints={parsedConstrs}
                    primalOptZ={simplexResult?.Z ? simplexResult.Z.toTex() : null}
                    onClose={handleClosePanel}
                />
            )}

            {activePanel === 'dual-table' && primalDataForStepper && (
                <EmbeddedDualStepperPanel
                    primalData={primalDataForStepper}
                    onClose={handleClosePanel}
                />
            )}
        </div>
    );
}
