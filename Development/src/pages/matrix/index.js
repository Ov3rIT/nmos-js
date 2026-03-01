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

    const {
        data: senders,
        loading: loadingS,
        error: errorS,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'senders',
        payload: queryConfig,
    });

    const {
        data: receivers,
        loading: loadingR,
        error: errorR,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'receivers',
        payload: queryConfig,
    });

    const {
        data: flows,
        loading: loadingF,
        error: errorF,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'flows',
        payload: queryConfig,
    });

    const {
        data: devices,
        loading: loadingD,
        error: errorD,
    } = useQueryWithStore({
        type: 'getList',
        resource: 'devices',
        payload: {
            ...queryConfig,
            sort: { field: 'id', order: 'ASC' },
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
            ...queryConfig,
            sort: { field: 'id', order: 'ASC' },
        },
    });

    if (errorS || errorR || errorF || errorD || errorN) return <Error />;
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
        <div>
            <MatrixVideo data={nmosData} />
        </div>
    );
};

export default MatrixPage;
