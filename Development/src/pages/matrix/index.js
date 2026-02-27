import React from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Caricamento Senders
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

    // Caricamento Receivers
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

    // Caricamento Devices
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

    // Caricamento Nodes (Indispensabile per l'IP di controllo)
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

    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;
    if (errorS || errorR || errorD || errorN)
        return <Error title="Errore Registry NMOS" />;

    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-page-container">
            <div className="matrix-header-bar">
                <h2>NMOS Matrix Control</h2>
                <span>
                    Nodes: {nmosData.nodes.length} | Senders:{' '}
                    {nmosData.senders.length}
                </span>
            </div>
            <div className="matrix-body">
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
