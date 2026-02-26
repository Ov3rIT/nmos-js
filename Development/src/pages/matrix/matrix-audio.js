import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixAudio = ({ data }) => {
    const { devices, senders, receivers } = data;

    // Filtriamo per formato Audio
    const audioSenders = senders.filter(s => s.format.includes('audio'));
    const audioReceivers = receivers.filter(r => r.format.includes('audio'));

    const currentConnections = {};
    audioReceivers.forEach(r => {
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
            <div className="matrix-toolbar">
                <h3 style={{ color: '#32cd32' }}>
                    Audio Routing Matrix (IS-05)
                </h3>
            </div>
            <MatrixBase
                devices={devices}
                senders={audioSenders}
                receivers={audioReceivers}
                connections={currentConnections}
                onConnect={handleConnect}
            />
        </div>
    );
};

export default MatrixAudio;
