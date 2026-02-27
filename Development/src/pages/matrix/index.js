import React from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Caricamento di tutte le risorse necessarie con limite a 100
    const queryConfig = {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'label', order: 'ASC' },
        filter: {},
    };

    const { data: senders, loading: loadingS } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: queryConfig,
    });

    const { data: receivers, loading: loadingR } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: queryConfig,
    });

    const { data: flows, loading: loadingF } = useQueryWithStore({
        type: 'getList',
        resource: 'flows',
        payload: queryConfig,
    });

    const { data: devices, loading: loadingD } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: { ...queryConfig, sort: { field: 'id', order: 'ASC' } },
    });

    const { data: nodes, loading: loadingN } = useQueryWithStore({
        type: 'getList',
        resource: 'nodes',
        payload: { ...queryConfig, sort: { field: 'id', order: 'ASC' } },
    });

    if (loadingS || loadingR || loadingF || loadingD || loadingN)
        return <Loading />;

    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        flows: flows || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-page-container">
            <div
                className="matrix-status-bar"
                style={{
                    padding: '10px 20px',
                    background: '#1a1a1a',
                    color: '#00d1b2',
                    borderBottom: '2px solid #333',
                }}
            >
                <strong>NMOS MATRIX CONTROL</strong>
                <span
                    style={{
                        marginLeft: '20px',
                        color: '#fff',
                        fontSize: '0.8rem',
                    }}
                >
                    S: {nmosData.senders.length} | R:{' '}
                    {nmosData.receivers.length} | F: {nmosData.flows.length}
                </span>
            </div>
            <MatrixVideo data={nmosData} />
        </div>
    );
};

export default MatrixPage;
