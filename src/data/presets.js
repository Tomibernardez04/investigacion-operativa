import { F } from '../logic/math.js';

export const PRESETS = {
    caso_factible: {
        id: 'caso_factible',
        title: '1. Factible Estándar (Solución Única)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(21),
        varNames: ['x1', 'x2', 'x3', 'x4'],
        dualVarNames: ['y3', 'y4', 'y1', 'y2'],
        origCosts: [F(3), F(5), F(0), F(0)],
        origResources: [F(8), F(12)],
        eqCoeffs: [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ]
    },
    caso_alternativas: {
        id: 'caso_alternativas',
        title: '2. Soluciones Alternativas (Arista Óptima)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(16),
        varNames: ['x1', 'x2', 'x3', 'x4'],
        dualVarNames: ['y3', 'y4', 'y1', 'y2'],
        origCosts: [F(2), F(4), F(0), F(0)],
        origResources: [F(8), F(12)],
        eqCoeffs: [
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(3), F(2)], sign: '<=', rhs: F(12) }
        ]
    },
    caso_degenerada: {
        id: 'caso_degenerada',
        title: '3. Solución Degenerada (Punto Triple)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(10),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5'],
        dualVarNames: ['y4', 'y5', 'y1', 'y2', 'y3'],
        origCosts: [F(3), F(2), F(0), F(0), F(0)],
        origResources: [F(4), F(6), F(2)],
        eqCoeffs: [
            { coeffs: [F(1), F(1)], sign: '<=', rhs: F(4) },
            { coeffs: [F(2), F(1)], sign: '<=', rhs: F(6) },
            { coeffs: [F(1), F(0)], sign: '<=', rhs: F(2) }
        ]
    },
    caso_incompatible: {
        id: 'caso_incompatible',
        title: '4. Sistema Incompatible (R = ∅)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: null,
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5'],
        dualVarNames: ['y4', 'y5', 'y6', 'y1', 'y2', 'y3'],
        origCosts: [F(5), F(8), F(0), F(0), F(0)],
        origResources: [F(30), F(5), F(6)],
        eqCoeffs: [
            { coeffs: [F(6), F(5)], sign: '<=', rhs: F(30) },
            { coeffs: [F(0), F(1)], sign: '>=', rhs: F(5) },
            { coeffs: [F(-2), F(2)], sign: '<=', rhs: F(6) }
        ]
    },
    caso_no_acotado: {
        id: 'caso_no_acotado',
        title: '5. Polígono Abierto (No Acotado)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: null,
        varNames: ['x1', 'x2', 'x3', 'x4'],
        dualVarNames: ['y3', 'y4', 'y1', 'y2'],
        origCosts: [F(2), F(3), F(0), F(0)],
        origResources: [F(2), F(4)],
        eqCoeffs: [
            { coeffs: [F(1), F(-1)], sign: '<=', rhs: F(2) },
            { coeffs: [F(1), F(0)], sign: '<=', rhs: F(4) }
        ]
    },
    casos_particulares_alt: {
        id: 'casos_particulares_alt',
        title: 'Diapo 20: Soluciones Alternativas (0*)',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(12),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5'],
        dualVarNames: ['y4', 'y5', 'y1', 'y2', 'y3'],
        origCosts: [F(3), F(3), F(0), F(0), F(0)],
        origResources: [F(48), F(42), F(36)],
        eqCoeffs: [
            { coeffs: [F(6), F(16)], sign: '<=', rhs: F(48) },
            { coeffs: [F(12), F(6)], sign: '<=', rhs: F(42) },
            { coeffs: [F(9), F(9)], sign: '<=', rhs: F(36) }
        ],
        base: [
            { var: 'x3', ck: F(0), B: F(14), row: [F(0), F(0), F(1), F(5, 3), F(-26, 9)] },
            { var: 'x1', ck: F(3), B: F(3), row: [F(1), F(0), F(0), F(1, 6), F(-1, 9)] },
            { var: 'x2', ck: F(3), B: F(1), row: [F(0), F(1), F(0), F(-1, 6), F(2, 9)] }
        ],
        zj_cj: [F(0), F(0), F(0), F(0), F(1, 3)]
    },
    slides_metal: {
        id: 'slides_metal',
        title: 'Ejemplo Diapos 37-45: Taller Metalúrgico',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(15000),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5'],
        dualVarNames: ['y4', 'y5', 'y1', 'y2', 'y3'],
        origCosts: [F(4), F(3), F(0), F(0), F(0)],
        origResources: [F(48000), F(42000), F(36000)],
        eqCoeffs: [
            { coeffs: [F(6), F(16)], sign: '<=', rhs: F(48000) },
            { coeffs: [F(12), F(6)], sign: '<=', rhs: F(42000) },
            { coeffs: [F(9), F(9)], sign: '<=', rhs: F(36000) }
        ],
        base: [
            { var: 'x3', ck: F(0), B: F(14000), row: [F(0), F(0), F(1), F(5, 3), F(-26, 9)] },
            { var: 'x1', ck: F(4), B: F(3000), row: [F(1), F(0), F(0), F(1, 6), F(-1, 9)] },
            { var: 'x2', ck: F(3), B: F(1000), row: [F(0), F(1), F(0), F(-1, 6), F(2, 9)] }
        ],
        zj_cj: [F(0), F(0), F(0), F(1, 6), F(2, 9)]
    },
    ex_4_2: {
        id: 'ex_4_2',
        title: 'Ejercicio 4.2 ➔ 5.6',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(1350),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'],
        dualVarNames: ['y4', 'y5', 'y6', 'y1', 'y2', 'y3'],
        origCosts: [F(3), F(2), F(5), F(0), F(0), F(0)],
        origResources: [F(430), F(460), F(420)],
        eqCoeffs: [
            { coeffs: [F(1), F(2), F(1)], sign: '<=', rhs: F(430) },
            { coeffs: [F(3), F(0), F(2)], sign: '<=', rhs: F(460) },
            { coeffs: [F(1), F(4), F(0)], sign: '<=', rhs: F(420) }
        ],
        base: [
            { var: 'x2', ck: F(2), B: F(100), row: [F(-1, 4), F(1), F(0), F(1, 2), F(-1, 4), F(0)] },
            { var: 'x3', ck: F(5), B: F(230), row: [F(3, 2), F(0), F(1), F(0), F(1, 2), F(0)] },
            { var: 'x6', ck: F(0), B: F(20), row: [F(2), F(0), F(0), F(-2), F(1), F(1)] }
        ],
        zj_cj: [F(4), F(0), F(0), F(1), F(2), F(0)]
    },
    ex_4_9: {
        id: 'ex_4_9',
        title: 'Ejercicio 4.9 ➔ 5.8',
        sense: 'MAX',
        dualSense: 'MIN',
        Z: F(96),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5'],
        dualVarNames: ['y4', 'y5', 'y1', 'y2', 'y3'],
        origCosts: [F(6), F(4), F(0), F(0), F(0)],
        origResources: [F(48), F(60), F(45)],
        eqCoeffs: [
            { coeffs: [F(2), F(4)], sign: '<=', rhs: F(48) },
            { coeffs: [F(4), F(2)], sign: '<=', rhs: F(60) },
            { coeffs: [F(3), F(0)], sign: '<=', rhs: F(45) }
        ],
        base: [
            { var: 'x2', ck: F(4), B: F(6), row: [F(0), F(1), F(1, 3), F(-1, 6), F(0)] },
            { var: 'x1', ck: F(6), B: F(12), row: [F(1), F(0), F(-1, 6), F(1, 3), F(0)] },
            { var: 'x5', ck: F(0), B: F(9), row: [F(0), F(0), F(1, 2), F(-1), F(1)] }
        ],
        zj_cj: [F(0), F(0), F(1, 3), F(4, 3), F(0)]
    },
    ex_4_12: {
        id: 'ex_4_12',
        title: 'Ejercicio 4.12 ➔ 5.9',
        sense: 'MIN',
        dualSense: 'MAX',
        Z: F(-4),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'],
        dualVarNames: ['y5', 'y6', 'y1', 'y2', 'y3', 'y4'],
        origCosts: [F(1), F(-2), F(0), F(0), F(0), F(0)],
        origResources: [F(2), F(10), F(8), F(1)],
        eqCoeffs: [
            { coeffs: [F(1), F(0)], sign: '>=', rhs: F(2) },
            { coeffs: [F(2), F(1)], sign: '<=', rhs: F(10) },
            { coeffs: [F(1), F(2)], sign: '<=', rhs: F(8) },
            { coeffs: [F(0), F(1)], sign: '>=', rhs: F(1) }
        ],
        base: [
            { var: 'x1', ck: F(1), B: F(2), row: [F(1), F(0), F(-1), F(0), F(0), F(0)] },
            { var: 'x4', ck: F(0), B: F(3), row: [F(0), F(0), F(3, 2), F(1), F(-1, 2), F(0)] },
            { var: 'x6', ck: F(0), B: F(2), row: [F(0), F(0), F(1, 2), F(0), F(1, 2), F(1)] },
            { var: 'x2', ck: F(-2), B: F(3), row: [F(0), F(1), F(1, 2), F(0), F(1, 2), F(0)] }
        ],
        zj_cj: [F(0), F(0), F(-2), F(0), F(-1), F(0)]
    },
    slides_min: {
        id: 'slides_min',
        title: 'Diapos 52-57: Minimización (Min ➔ Max)',
        sense: 'MIN',
        dualSense: 'MAX',
        Z: F(16, 10),
        varNames: ['x1', 'x2', 'x3', 'x4', 'x5', 'lambda'],
        dualVarNames: ['y4', 'y5', 'y6', 'y1', 'y2', 'y3'],
        origCosts: [F(1), F(1, 2), F(2), F(0), F(0), F(0)],
        origResources: [F(36, 10), F(12, 10), F(1)],
        eqCoeffs: [
            { coeffs: [F(3), F(2), F(4)], sign: '<=', rhs: F(36, 10) },
            { coeffs: [F(1), F(1, 2), F(2)], sign: '>=', rhs: F(12, 10) },
            { coeffs: [F(1), F(1), F(1)], sign: '=', rhs: F(1) }
        ],
        base: [
            { var: 'x1', ck: F(1), B: F(4, 10), row: [F(1), F(2), F(0), F(1), F(0), F(4)] },
            { var: 'x5', ck: F(0), B: F(4, 10), row: [F(0), F(-1, 2), F(0), F(-1), F(1), F(-2)] },
            { var: 'x3', ck: F(2), B: F(6, 10), row: [F(0), F(1), F(1), F(-1), F(0), F(-3)] }
        ],
        zj_cj: [F(0), F(-1, 2), F(0), F(-1), F(0), F(-2)]
    }
};
