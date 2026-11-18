import React, { useState } from 'react';
import Header from './components/Header.jsx';
import EquationsTab from './components/EquationsTab/EquationsTab.jsx';
import TutorialTab from './components/TutorialTab.jsx';
import VerifierTab from './components/VerifierTab.jsx';
import TheoryTab from './components/TheoryTab.jsx';
import './styles/app.css';

export default function App() {
    const [activeTab, setActiveTab] = useState('equations');

    return (
        <div className="app-container">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            <main style={{ padding: '16px 20px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
                {activeTab === 'equations' && <EquationsTab />}
                {activeTab === 'stepper' && <TutorialTab />}
                {activeTab === 'verifier' && <VerifierTab />}
                {activeTab === 'theory' && <TheoryTab />}
            </main>
        </div>
    );
}
