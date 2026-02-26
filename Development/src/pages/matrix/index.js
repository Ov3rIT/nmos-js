import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { crudGetList } from 'react-admin'; // Azione per caricare dati in Redux
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');
    const dispatch = useDispatch();

    // Leggiamo lo stato di Redux
    const resources = useSelector(state => state.admin.resources);

    // Se i dati mancano, forziamo il caricamento
    useEffect(() => {
        const loadIfMissing = name => {
            if (
                !resources[name] ||
                !resources[name].data ||
                Object.keys(resources[name].data).length === 0
            ) {
                console.log(`Caricamento forzato risorsa: ${name}`);
                dispatch(
                    crudGetList(
                        name,
                        { page: 1, perPage: 1000 },
                        { field: 'id', order: 'ASC' },
                        {}
                    )
                );
            }
        };

        loadIfMissing('sender');
        loadIfMissing('receiver');
        loadIfMissing('device');
    }, [dispatch, resources]);

    const nmosData = useMemo(() => {
        const extractData = name => {
            const res = resources[name];
            return res && res.data ? Object.values(res.data) : [];
        };

        return {
            senders: extractData('sender'),
            receivers: extractData('receiver'),
            devices: extractData('device'),
        };
    }, [resources]);

    // Mostriamo lo spinner solo se non c'è proprio nulla dopo il tentativo di caricamento
    const isReady =
        nmosData.senders.length > 0 || nmosData.receivers.length > 0;

    if (!isReady) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Sincronizzazione con il Registry NMOS in corso...</p>
            </div>
        );
    }

    return (
        <div className="matrix-container-main">
            <div className="matrix-header">
                <div className="matrix-tabs-bar">
                    <button
                        className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        VIDEO
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audio')}
                    >
                        AUDIO
                    </button>
                </div>
            </div>
            <div className="matrix-content-area">
                {activeTab === 'video' ? (
                    <MatrixVideo data={nmosData} />
                ) : (
                    <MatrixAudio data={nmosData} />
                )}
            </div>
        </div>
    );
};

export default MatrixPage;
