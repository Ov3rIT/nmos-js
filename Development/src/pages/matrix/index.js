import React from 'react';
import { Error, Loading, useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    // Configurazione query per il Registry NMOS
    // Usiamo perPage: 100 per allinearci al test che hai fatto con successo
    const queryParams = {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'label', order: 'ASC' },
        filter: {},
    };

    const {
        data: senders,
        loading: loadingS,
        error: errorS,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: queryParams,
    });

    const {
        data: receivers,
        loading: loadingR,
        error: errorR,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: queryParams,
    });

    const { data: devices, loading: loadingD } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: { ...queryParams, sort: { field: 'id', order: 'ASC' } },
    });

    const { data: nodes, loading: loadingN } = useQueryWithStore({
        type: 'getList',
        resource: 'nodes',
        payload: { ...queryParams, sort: { field: 'id', order: 'ASC' } },
    });

    if (loadingS || loadingR || loadingD || loadingN) return <Loading />;
    if (errorS || errorR)
        return (
            <Error title="Errore durante la lettura dal Query Service NMOS" />
        );

    const nmosData = {
        senders: senders || [],
        receivers: receivers || [],
        devices: devices || [],
        nodes: nodes || [],
    };

    return (
        <div className="matrix-page">
            <div
                className="matrix-header-status"
                style={{
                    padding: '12px 20px',
                    backgroundColor: '#1e1e1e',
                    color: '#00d1b2',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <strong>NMOS CONTROL PANEL v1.3</strong>
                <span>
                    {nmosData.senders.length} Senders |{' '}
                    {nmosData.receivers.length} Receivers
                </span>
            </div>

            <div className="matrix-main-content">
                <MatrixVideo data={nmosData} />
            </div>
        </div>
    );
};

export default MatrixPage;
