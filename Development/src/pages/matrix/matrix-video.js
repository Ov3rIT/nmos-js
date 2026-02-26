import React from 'react';
import MatrixBase from './MatrixBase'; // IMPORT DEFAULT
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const { devices, senders, receivers } = data;

    const videoSenders = senders.filter(
        s => s.format && s.format.includes('video')
    );
    const videoReceivers = receivers.filter(
        r => r.format && r.format.includes('video')
    );

    const currentConnections = {};
    videoReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    const handleConnect = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
        } else {
            makeConnection(receiver, sender);
        }
    };

    return (
        <div className="matrix-page">
            <MatrixBase
                devices={devices}
                senders={videoSenders}
                receivers={videoReceivers}
                connections={currentConnections}
                onConnect={handleConnect}
            />
        </div>
    );
};

export default MatrixVideo; // <--- FONDAMENTALE
