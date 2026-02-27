import React from 'react';
import { Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // 1. Definiamo le query per tutte le risorse necessarie
    const { data: senders, loading: loadingS } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    const { data: receivers, loading: loadingR } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    const { data: devices, loading: loadingD } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    // Aggiungiamo i NODES (servono per trovare l'IP di controllo IS-05)
    const { data: nodes, loading: loadingN } = useQueryWithStore({
        type: 'getList',
        resource: 'nodes',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    // 2. Mostriamo il caricamento finché i dati non sono pronti
    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;

    // 3. ORA dichiariamo nmosData (dopo che le query sono state definite)
    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-container-main">
            <div className="matrix-header">
                <h2 style={{ marginLeft: '20px', fontSize: '18px' }}>
                    NMOS UNIFIED PATCH PANEL
                </h2>
            </div>
            <div className="matrix-content-area">
                {/* Passiamo nmosData al componente della matrice */}
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
