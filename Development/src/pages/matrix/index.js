import React, { useState } from 'react';
import { ListController } from 'react-admin';
import MatrixVideo from './matrix-video';
import MatrixAudio from './matrix-audio';
import './matrix-style.css';

const MatrixPage = () => {
    const [activeTab, setActiveTab] = useState('video');

    return (
        /* Usiamo ListController per caricare 'senders' (plurale) */
        <ListController
            resource="senders"
            pagination={{ page: 1, perPage: 1000 }}
        >
            {({ data: senders, isLoading: loadingS }) => (
                <ListController
                    resource="receivers"
                    pagination={{ page: 1, perPage: 1000 }}
                >
                    {({ data: receivers, isLoading: loadingR }) => (
                        <ListController
                            resource="devices"
                            pagination={{ page: 1, perPage: 1000 }}
                        >
                            {({ data: devices, isLoading: loadingD }) => {
                                if (loadingS || loadingR || loadingD) {
                                    return (
                                        <div className="loading-state">
                                            Fetching NMOS Data...
                                        </div>
                                    );
                                }

                                const nmosData = {
                                    senders: Object.values(senders || {}),
                                    receivers: Object.values(receivers || {}),
                                    devices: Object.values(devices || {}),
                                };

                                return (
                                    <div className="matrix-container-main">
                                        <div className="matrix-header">
                                            <div className="matrix-tabs-bar">
                                                <button
                                                    className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                                                    onClick={() =>
                                                        setActiveTab('video')
                                                    }
                                                >
                                                    {' '}
                                                    VIDEO{' '}
                                                </button>
                                                <button
                                                    className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
                                                    onClick={() =>
                                                        setActiveTab('audio')
                                                    }
                                                >
                                                    {' '}
                                                    AUDIO{' '}
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
                            }}
                        </ListController>
                    )}
                </ListController>
            )}
        </ListController>
    );
};

export default MatrixPage;
