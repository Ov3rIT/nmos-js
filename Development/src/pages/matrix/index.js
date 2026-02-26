import React, { useState, useContext } from 'react';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import { NMOSContext } from '../../context/NMOSContext'; // Verifica questo percorso nel tuo fork
import './matrix-style.css';

/**
 * MatrixPage - Punto di ingresso per la gestione del routing stile Dante.
 * Funziona come una "Resource" React.
 */
const MatrixPage = props => {
    const [activeTab, setActiveTab] = useState('video');

    // Tenta di recuperare i dati in ordine di priorità:
    // 1. Dalle props (se iniettate dal sistema Resource)
    // 2. Dal Context (stato globale NMOS)
    const contextData = useContext(NMOSContext);
    const nmosData = props.data || contextData || props;

    // Funzione per renderizzare il caricamento se i dati non sono ancora pronti
    const renderContent = () => {
        if (!nmosData || (!nmosData.senders && !props.senders)) {
            return (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>In attesa di dati dal Registry NMOS...</p>
                </div>
            );
        }

        return activeTab === 'video' ? (
            <MatrixVideo data={nmosData} />
        ) : (
            <MatrixAudio data={nmosData} />
        );
    };

    return (
        <div className="matrix-container-main">
            {/* Header della pagina con Switcher */}
            <div className="matrix-header">
                <h2>NMOS Routing Matrix</h2>
                <div className="matrix-tabs-bar">
                    <button
                        className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        <span className="icon">🎬</span> VIDEO
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        <span className="icon">🔊</span> AUDIO
                    </button>
                </div>
            </div>

            {/* Area della Matrice */}
            <div className="matrix-content-area">{renderContent()}</div>

            {/* Footer informativo opzionale stile Dante */}
            <div className="matrix-footer">
                <span>P: Primary Network</span>
                <span>S: Secondary Network</span>
                <span className="status-indicator">
                    Connected to Registry: OK
                </span>
            </div>
        </div>
    );
};

export default MatrixPage;
