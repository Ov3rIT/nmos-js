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

    // Dentro index.js, semplifica il return:
    return (
        <div className="matrix-container-main">
            <div className="matrix-header">
                <h2 style={{ marginLeft: '20px', fontSize: '18px' }}>
                    NMOS UNIFIED PATCH PANEL
                </h2>
            </div>
            <div className="matrix-content-area">
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
