import React, { useState, useMemo } from 'react';
import { useGetList } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Recupero dati IS-04
    const { data: sendersData, isLoading: loadingS } = useGetList('senders', {
        pagination: { page: 1, perPage: 1000 },
    });
    const { data: receiversData, isLoading: loadingR } = useGetList(
        'receivers',
        {
            pagination: { page: 1, perPage: 1000 },
        }
    );
    const { data: devicesData, isLoading: loadingD } = useGetList('devices', {
        pagination: { page: 1, perPage: 1000 },
    });

    // Usiamo useMemo per trasformare i dati solo quando cambiano
    const nmosData = useMemo(() => {
        const sanitize = data => {
            if (!data) return [];
            // Se è già un array lo restituisce, altrimenti prova a estrarre i valori se è un oggetto
            return Array.isArray(data) ? data : Object.values(data);
        };

        return {
            senders: sanitize(sendersData),
            receivers: sanitize(receiversData),
            devices: sanitize(devicesData),
        };
    }, [sendersData, receiversData, devicesData]);

    if (loadingS || loadingR || loadingD) {
        return <div className="loading-state">Loading NMOS Data...</div>;
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
