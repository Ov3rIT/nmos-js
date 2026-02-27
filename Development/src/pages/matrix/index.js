import React, { useMemo } from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Caricamento asincrono di tutte le risorse NMOS necessarie
    const {
        data: senders,
        loading: loadingS,
        error: errorS,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    const {
        data: receivers,
        loading: loadingR,
        error: errorR,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    const {
        data: devices,
        loading: loadingD,
        error: errorD,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    const {
        data: nodes,
        loading: loadingN,
        error: errorN,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'nodes',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    // Stato di caricamento
    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;

    // Gestione errori di rete
    if (errorS || errorR || errorD || errorN)
        return <Error title="Errore nel caricamento del Registry NMOS" />;

    // Organizzazione dei dati per MatrixVideo
    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-container-main">
            <div
                className="matrix-header"
                style={{
                    padding: '10px 20px',
                    background: '#2c3e50',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h2 style={{ margin: 0, fontSize: '18px' }}>
                    NMOS UNIFIED PATCH PANEL
                </h2>
                <div style={{ fontSize: '12px' }}>
                    Nodi: {nmosData.nodes.length} | Senders:{' '}
                    {nmosData.senders.length} | Receivers:{' '}
                    {nmosData.receivers.length}
                </div>
            </div>

            <div className="matrix-content-area" style={{ padding: '20px' }}>
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
