import React, { useState, useEffect } from 'react';
import MathView from '../MathView.jsx';

export default function EquationBuilder({
    sense,
    setSense,
    nVars,
    setNVars,
    nRows,
    setNRows,
    c,
    setC,
    constraints,
    setConstraints
}) {
    const [rawNVars, setRawNVars] = useState(String(nVars));
    const [rawNRows, setRawNRows] = useState(String(nRows));

    useEffect(() => {
        setRawNVars(String(nVars));
    }, [nVars]);

    useEffect(() => {
        setRawNRows(String(nRows));
    }, [nRows]);

    const handleSenseChange = (e) => setSense(e.target.value);

    const applyNVarsChange = (val) => {
        setNVars(val);
        // Adjust c array
        const newC = [...c];
        while (newC.length < val) newC.push('1');
        while (newC.length > val) newC.pop();
        setC(newC);

        // Adjust constraints coeffs
        const newConstrs = constraints.map(row => {
            const newCoeffs = [...row.coeffs];
            while (newCoeffs.length < val) newCoeffs.push('1');
            while (newCoeffs.length > val) newCoeffs.pop();
            return { ...row, coeffs: newCoeffs };
        });
        setConstraints(newConstrs);
    };

    const handleNVarsInputChange = (e) => {
        const text = e.target.value;
        setRawNVars(text);
        if (text === '') return;
        const parsed = parseInt(text, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
            applyNVarsChange(parsed);
        }
    };

    const handleNVarsBlur = () => {
        let parsed = parseInt(rawNVars, 10);
        if (isNaN(parsed) || parsed < 1) parsed = 1;
        if (parsed > 6) parsed = 6;
        setRawNVars(String(parsed));
        applyNVarsChange(parsed);
    };

    const applyNRowsChange = (val) => {
        setNRows(val);
        const newConstrs = [...constraints];
        while (newConstrs.length < val) {
            newConstrs.push({
                coeffs: new Array(nVars).fill('1'),
                sign: '<=',
                rhs: String(10 * (newConstrs.length + 1))
            });
        }
        while (newConstrs.length > val) newConstrs.pop();
        setConstraints(newConstrs);
    };

    const handleNRowsInputChange = (e) => {
        const text = e.target.value;
        setRawNRows(text);
        if (text === '') return;
        const parsed = parseInt(text, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
            applyNRowsChange(parsed);
        }
    };

    const handleNRowsBlur = () => {
        let parsed = parseInt(rawNRows, 10);
        if (isNaN(parsed) || parsed < 1) parsed = 1;
        if (parsed > 6) parsed = 6;
        setRawNRows(String(parsed));
        applyNRowsChange(parsed);
    };

    const handleCostChange = (idx, val) => {
        const newC = [...c];
        newC[idx] = val;
        setC(newC);
    };

    const handleCoeffChange = (rIdx, cIdx, val) => {
        const newConstrs = [...constraints];
        newConstrs[rIdx].coeffs[cIdx] = val;
        setConstraints(newConstrs);
    };

    const handleSignChange = (rIdx, val) => {
        const newConstrs = [...constraints];
        newConstrs[rIdx].sign = val;
        setConstraints(newConstrs);
    };

    const handleRhsChange = (rIdx, val) => {
        const newConstrs = [...constraints];
        newConstrs[rIdx].rhs = val;
        setConstraints(newConstrs);
    };

    return (
        <div className="card-panel">
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    1. Ecuaciones Iniciales del Problema Directo
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Ingresá la Función Objetivo y las restricciones originales. De aquí se obtienen los costos c<sub>j</sub> y los recursos b<sub>i</sub> reales para completar con 100% de exactitud la columna c<sub>k</sub> del Dual.
                </p>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="eq-sense-select">Sentido:</label>
                    <select id="eq-sense-select" className="form-control" value={sense} onChange={handleSenseChange}>
                        <option value="MAX">Maximizar (Z ➔ Máx)</option>
                        <option value="MIN">Minimizar (Z ➔ Mín)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="eq-nvars-input">Variables de Decisión (n):</label>
                    <input
                        id="eq-nvars-input"
                        type="number"
                        className="form-control"
                        value={rawNVars}
                        min="1"
                        max="6"
                        onChange={handleNVarsInputChange}
                        onBlur={handleNVarsBlur}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="eq-nrows-input">Restricciones (m):</label>
                    <input
                        id="eq-nrows-input"
                        type="number"
                        className="form-control"
                        value={rawNRows}
                        min="1"
                        max="6"
                        onChange={handleNRowsInputChange}
                        onBlur={handleNRowsBlur}
                    />
                </div>
            </div>

            <div id="equation-builder-container" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Objective Function */}
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap'
                    }}>
                        <b style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{sense} Z = </b>
                        {c.slice(0, nVars).map((costVal, j) => (
                            <React.Fragment key={`cost-${j}`}>
                                <input
                                    type="text"
                                    className="cell-input"
                                    value={costVal}
                                    style={{ width: '60px' }}
                                    onChange={(e) => handleCostChange(j, e.target.value)}
                                    aria-label={`c_${j + 1}`}
                                />
                                <MathView math={`x_${j + 1}`} />
                                {j < nVars - 1 && <span>+</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Constraints */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <b style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Sujeto a las Restricciones:
                        </b>
                        {constraints.slice(0, nRows).map((row, i) => (
                            <div
                                key={`row-${i}`}
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)', width: '30px', fontWeight: 700 }}>
                                    R{i + 1}:
                                </span>
                                {row.coeffs.slice(0, nVars).map((coeffVal, j) => (
                                    <React.Fragment key={`r-${i}-c-${j}`}>
                                        <input
                                            type="text"
                                            className="cell-input"
                                            value={coeffVal}
                                            style={{ width: '55px' }}
                                            onChange={(e) => handleCoeffChange(i, j, e.target.value)}
                                            aria-label={`a_${i + 1}_${j + 1}`}
                                        />
                                        <MathView math={`x_${j + 1}`} />
                                        {j < nVars - 1 && <span>+</span>}
                                    </React.Fragment>
                                ))}
                                <select
                                    className="cell-select"
                                    value={row.sign}
                                    style={{ width: '55px', fontWeight: 800, color: 'var(--primary)' }}
                                    onChange={(e) => handleSignChange(i, e.target.value)}
                                    aria-label={`sign_${i + 1}`}
                                >
                                    <option value="<=">&le;</option>
                                    <option value=">=">&ge;</option>
                                    <option value="=">=</option>
                                </select>
                                <input
                                    type="text"
                                    className="cell-input"
                                    value={row.rhs}
                                    style={{ width: '75px' }}
                                    placeholder={`b${i + 1}`}
                                    onChange={(e) => handleRhsChange(i, e.target.value)}
                                    aria-label={`b_${i + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
