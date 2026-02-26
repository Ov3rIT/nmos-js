import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Accediamo direttamente allo stato globale di React-Admin
    // In questo fork, i dati sono solitamente sotto admin.resources.[nome].data
    const resources = useSelector(state => state.admin.resources);

    const nmosData = useMemo(() => {
        const extractData = resourceName => {
            const resource = resources[resourceName];
            if (!resource || !resource.data) return [];
            // Trasformiamo l'oggetto { id: {obj} } in array [ {obj} ]
            return Object.values(resource.data);
        };

        return {
            senders: extractData('sender'),
            receivers: extractData('receiver'),
            devices: extractData('device'),
        };
    }, [resources]);

    // Se Redux è ancora vuoto (es. primo caricamento)
    if (nmosData.senders.length === 0 && nmosData.receivers.length === 0) {
        return (
            <div className="loading-state">
                <h3>Connecting to NMOS Store...</h3>
                <p>
                    Se vedi questo messaggio a lungo, apri prima la lista
                    Senders/Receivers per caricare i dati.
                </p>
            </div>
        );
    }

    return (
        <div className="matrix-container-main">
            <div className="matrix-header">
                <div className="matrix-tabs-bar">
                    <button
                        className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        {' '}
                        VIDEO{' '}
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        {' '}
                        AUDIO{' '}
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
