import React, { useMemo, useState } from 'react';
import { useGetList } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Proviamo a caricare le risorse.
    // Se 'sender' non funziona, prova a cambiare manualmente in 'senders' qui sotto.
    const senderRes = useGetList('sender', {
        pagination: { page: 1, perPage: 1000 },
    });
    const receiverRes = useGetList('receiver', {
        pagination: { page: 1, perPage: 1000 },
    });
    const deviceRes = useGetList('device', {
        pagination: { page: 1, perPage: 1000 },
    });

    const nmosData = useMemo(() => {
        const extract = res => {
            // Logghiamo cosa arriva effettivamente da React-Admin per ogni risorsa
            console.log(`Resource ${activeTab} debug:`, res);

            if (res.data && Array.isArray(res.data)) return res.data;
            if (res.data && typeof res.data === 'object')
                return Object.values(res.data);
            return [];
        };

        return {
            senders: extract(senderRes),
            receivers: extract(receiverRes),
            devices: extract(deviceRes),
        };
    }, [senderRes, receiverRes, deviceRes, activeTab]);

    const isLoading =
        senderRes.isLoading || receiverRes.isLoading || deviceRes.isLoading;

    if (isLoading) {
        return (
            <div className="loading-state">Connecting to NMOS Registry...</div>
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
                        VIDEO
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        AUDIO
                    </button>
                </div>
            </div>
            <div className="matrix-content-area">
                {/* Se gli array sono vuoti, mostriamo un debug a schermo */}
                {nmosData.senders.length === 0 && (
                    <div
                        style={{
                            padding: '20px',
                            color: '#d32f2f',
                            background: '#ffcdd2',
                            margin: '10px',
                        }}
                    >
                        <strong>DEBUG:</strong> Nessun Sender trovato. Controlla
                        la console (F12) per vedere il formato dei dati.
                    </div>
                )}
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
