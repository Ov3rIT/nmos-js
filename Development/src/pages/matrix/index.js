import React, { useEffect, useRef, useState } from 'react';
import { useQueryWithStore } from 'react-admin';
import MatrixVideo from './matrix-video';
import './matrix-style.css';

const MatrixPage = () => {
    const queryConfig = {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'label', order: 'ASC' },
        filter: {},
    };

    /*
     * Query originali
     */

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

    /*
     * 🔥 STATO STABILE ANTI-FLICKER
     */

    const [stableData, setStableData] = useState({
        senders: [],
        receivers: [],
        flows: [],
        devices: [],
        nodes: [],
    });

    const hasInitialized = useRef(false);

    useEffect(() => {
        if (senders && receivers && flows && devices && nodes) {
            setStableData({
                senders,
                receivers,
                flows,
                devices,
                nodes,
            });

            hasInitialized.current = true;
        }
    }, [senders, receivers, flows, devices, nodes]);

    /*
     * ⛔ IMPORTANTISSIMO:
     * Mostriamo <Loading /> SOLO al primo mount
     * Mai più dopo.
     */

    if (!hasInitialized.current) {
        if (loadingS || loadingR || loadingF || loadingD || loadingN) {
            return <div style={{ height: '100vh' }} />;
        }
    }

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
                    S: {stableData.senders.length} | R:{' '}
                    {stableData.receivers.length} | F: {stableData.flows.length}
                </span>
            </div>

            <MatrixVideo data={stableData} />
        </div>
    );
};

export default MatrixPage;
