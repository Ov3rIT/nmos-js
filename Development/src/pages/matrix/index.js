import React, { useState } from 'react';
import { useGetList } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Recuperiamo i dati dalle risorse dichiarate in App.js
    const { data: senders, isLoading: loadingS } = useGetList('senders', {
        pagination: { page: 1, perPage: 1000 },
    });
    const { data: receivers, isLoading: loadingR } = useGetList('receivers', {
        pagination: { page: 1, perPage: 1000 },
    });
    const { data: devices, isLoading: loadingD } = useGetList('devices', {
        pagination: { page: 1, perPage: 1000 },
    });

    if (loadingS || loadingR || loadingD) {
        return <div className="loading-state">Caricamento flussi NMOS...</div>;
    }

    // Creiamo l'oggetto data da passare ai componenti video/audio
    const nmosData = {
        senders: Object.values(senders || {}),
        receivers: Object.values(receivers || {}),
        devices: Object.values(devices || {}),
    };

    return (
        <div className="matrix-container-main">
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

            <div className="matrix-content-area">
                {activeTab === 'video' ? (
                    <MatrixVideo data={nmosData} />
                ) : (
                    <MatrixAudio data={nmosData} />
                )}
            </div>
        </div>
    );
};

export default MatrixPage;
