import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

// In src/pages/matrix/matrix-video.js
const MatrixVideo = ({ data }) => {
    const { devices = [], senders = [], receivers = [] } = data;

    // DEBUG: Commentiamo i filtri per vedere se appare qualcosa
    const videoSenders = senders;
    const videoReceivers = receivers;

    // Log per vedere cosa arriva effettivamente nei dati
    console.log('SENDERS:', senders);
    console.log('DEVICES:', devices);

    // ... resto del codice

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
