import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const { devices = [], senders = [], receivers = [] } = data;

    // Filtro più permissivo: se il formato non è specificato, lo includiamo per debug
    const videoSenders = senders.filter(
        s => !s.format || s.format.toLowerCase().includes('video')
    );
    const videoReceivers = receivers.filter(
        r => !r.format || r.format.toLowerCase().includes('video')
    );

    const currentConnections = {};
    videoReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    return (
        <MatrixBase
            devices={devices}
            senders={videoSenders}
            receivers={videoReceivers}
            connections={currentConnections}
            onConnect={(r, s, isConnected) => {
                makeConnection(r, isConnected ? null : s);
            }}
        />
    );
};

export default MatrixVideo;
