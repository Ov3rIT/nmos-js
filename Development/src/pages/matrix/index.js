import React, { useState } from 'react';
import { Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    // Recuperiamo i Senders
    const { data: senders, loading: loadingS } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    // Recuperiamo i Receivers
    const { data: receivers, loading: loadingR } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    // Recuperiamo i Devices
    const { data: devices, loading: loadingD } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    if (loadingS || loadingR || loadingD) return <Loading />;

    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
    };

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
