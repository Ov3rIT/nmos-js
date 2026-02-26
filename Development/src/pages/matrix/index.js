import React, { useState } from 'react';
import { useGetList } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

/**
 * MatrixPage - Punto di ingresso per la risorsa "matrix"
 * Recupera i dati dal dataProvider di NMOS tramite react-admin hooks
 */
const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Recupero dati tramite react-admin (IS-04)
    // Usiamo pagination 1000 per assicurarci di caricare tutti i flussi nella griglia
    const { data: senders, isLoading: loadingS } = useGetList('senders', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'label', order: 'ASC' },
    });
    const { data: receivers, isLoading: loadingR } = useGetList('receivers', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'label', order: 'ASC' },
    });
    const { data: devices, isLoading: loadingD } = useGetList('devices', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'label', order: 'ASC' },
    });

    // Stato di caricamento
    if (loadingS || loadingR || loadingD) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Fetching NMOS Registry data...</p>
            </div>
        );
    }

    // Preparazione dati per i sotto-componenti
    // Convertiamo l'oggetto react-admin in array se necessario
    const nmosData = {
        senders: Array.isArray(senders)
            ? senders
            : Object.values(senders || {}),
        receivers: Array.isArray(receivers)
            ? receivers
            : Object.values(receivers || {}),
        devices: Array.isArray(devices)
            ? devices
            : Object.values(devices || {}),
    };

    return (
        <div className="matrix-container-main">
            {/* Navigazione Tabs */}
            <div className="matrix-header">
                <div className="matrix-tabs-bar">
                    <button
                        className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        VIDEO ROUTING
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        AUDIO ROUTING
                    </button>
                </div>
            </div>

            {/* Area Matrice */}
            <div className="matrix-content-area">
                {activeTab === 'video' ? (
                    <MatrixVideo data={nmosData} />
                ) : (
                    <MatrixAudio data={nmosData} />
                )}
            </div>

            {/* Footer di stato */}
            <div className="matrix-footer">
                <span>Devices: {nmosData.devices.length}</span>
                <span> | </span>
                <span>Senders: {nmosData.senders.length}</span>
                <span> | </span>
                <span>Receivers: {nmosData.receivers.length}</span>
            </div>
        </div>
    );
};

export default MatrixPage;
