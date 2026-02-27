import React, { useMemo } from 'react';
import { useQueryWithStore, Loading, Error } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // 1. Caricamento Senders
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

    // 2. Caricamento Receivers
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

    // 3. Caricamento Devices
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

    // 4. Caricamento Nodes (Cruciale per trovare l'IP di controllo IS-05)
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

    // 5. Gestione stati di caricamento ed errore
    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;
    if (errorS || errorR || errorD || errorN)
        return <Error title="Errore nel caricamento delle risorse NMOS" />;

    // 6. Preparazione del pacchetto dati con useMemo per ottimizzare le prestazioni
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
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '500' }}>
                    NMOS UNIFIED PATCH PANEL
                </h2>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Registrati: {nmosData.nodes.length} Nodi |{' '}
                    {nmosData.senders.length} Senders
                </div>
            </div>

            <div className="matrix-content-area" style={{ padding: '20px' }}>
                {/* Passiamo i dati alla matrice. 
                  MatrixVideo userà l'array 'nodes' per estrarre l'IP 
                  e costruire l'URL di patch IS-05.
                */}
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
