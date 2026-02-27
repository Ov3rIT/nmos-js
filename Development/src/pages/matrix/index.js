import React from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Caricamento Senders (Encoder) - Limite alzato a 1000
    const {
        data: senders,
        loading: loadingS,
        error: errorS,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'label', order: 'ASC' },
            filter: {},
        },
    });

    // Caricamento Receivers (Decoder) - Limite alzato a 1000
    const {
        data: receivers,
        loading: loadingR,
        error: errorR,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'label', order: 'ASC' },
            filter: {},
        },
    });

    // Caricamento Devices - Indispensabile per collegare Receiver e Node
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

    // Caricamento Nodes - Fondamentale per recuperare gli IP di controllo (IS-05)
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

    // Gestione stati di caricamento ed errore
    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;
    if (errorS || errorR || errorD || errorN) {
        return <Error title="Errore nel recupero dati dal Registry NMOS" />;
    }

    // Preparazione dell'oggetto data per MatrixVideo
    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-wrapper">
            {/* Header informativo */}
            <div
                className="matrix-info-header"
                style={{
                    padding: '10px 20px',
                    background: '#24292e',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #007bff',
                }}
            >
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    NMOS BROADCAST MATRIX
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Totale Senders: {nmosData.senders.length} | Totale
                    Receivers: {nmosData.receivers.length}
                </div>
            </div>

            {/* Area Matrice */}
            <div className="matrix-container" style={{ padding: '20px' }}>
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
