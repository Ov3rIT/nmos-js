import React from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Carichiamo tutte le risorse NMOS necessarie dallo store
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

    const { data: nodes, loading: loadingN } = useQueryWithStore({
        type: 'getList',
        resource: 'nodes',
        payload: {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {},
        },
    });

    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;

    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-container">
            <div
                className="matrix-header"
                style={{
                    background: '#1a1a1a',
                    color: 'white',
                    padding: '15px',
                }}
            >
                <h2 style={{ margin: 0 }}>NMOS IS-05 Matrix Control</h2>
                <small>
                    Registry: 172.16.1.110 | Nodes Found:{' '}
                    {nmosData.nodes.length}
                </small>
            </div>
            <MatrixVideo data={nmosData} />
        </div>
    );
};

export default MatrixPage;
