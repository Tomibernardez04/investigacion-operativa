import React from 'react';

export default function Header({ activeTab, setActiveTab }) {
    return (
        <header>
            <div className="header-brand">
                <div className="header-icon" title="Simplex ⇄ Dual">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <defs>
                            <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                        </defs>
                        <path d="M4 8h13M13 4.5l4.5 3.5-4.5 3.5" stroke="url(#headerGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 16H7M11 12.5L6.5 16l4.5 3.5" stroke="url(#headerGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="header-title">
                    <h1>Investigación Operativa</h1>
                </div>
            </div>

            <nav className="nav-tabs">
                <button
                    className={`tab-btn ${activeTab === 'equations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('equations')}
                >
                    🚀 Desde Ecuaciones
                </button>
                <button
                    className={`tab-btn ${activeTab === 'stepper' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stepper')}
                >
                    🎬 Paso a Paso (Tutorial)
                </button>
                <button
                    className={`tab-btn ${activeTab === 'verifier' ? 'active' : ''}`}
                    onClick={() => setActiveTab('verifier')}
                >
                    🧪 Practicar / Verificar
                </button>
                <button
                    className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theory')}
                >
                    📖 Reglas de Diapos (36-59)
                </button>
            </nav>
        </header>
    );
}
