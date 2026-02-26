import React, { useMemo, useState } from 'react';
import { useGetList } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Nel tuo fork le risorse si chiamano al singolare: 'sender', 'receiver', 'device'
    const { data: sendersMap, isLoading: loadingS } = useGetList('sender', {
        pagination: { page: 1, perPage: 1000 },
    });
    const { data: receiversMap, isLoading: loadingR } = useGetList('receiver', {
        pagination: { page: 1, perPage: 1000 },
    });
    const { data: devicesMap, isLoading: loadingD } = useGetList('device', {
        pagination: { page: 1, perPage: 1000 },
    });

    const nmosData = useMemo(() => {
        // Funzione per estrarre l'array di oggetti dai dati di react-admin
        const getArray = data => {
            if (!data) return [];
            return Array.isArray(data) ? data : Object.values(data);
        };

        return {
            senders: getArray(sendersMap),
            receivers: getArray(receiversMap),
            devices: getArray(devicesMap),
        };
    }, [sendersMap, receiversMap, devicesMap]);

    if (loadingS || loadingR || loadingD) {
        return <div className="loading-state">Loading NMOS Matrix...</div>;
    }

    return (
        <div
            className="matrix-container-main"
            style={{ backgroundColor: '#1a1a1a', height: '100vh' }}
        >
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
                {/* Debug temporaneo: se non vedi nulla, questo ti dirà se i dati esistono */}
                {nmosData.senders.length === 0 && (
                    <div style={{ color: 'orange', padding: '20px' }}>
                        Warning: No Senders found in Registry.
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
