import React from 'react';
import MatrixBase from './MatrixBase';
// Importa la logica di connessione dal tuo file esistente
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const { nodes, devices, senders, receivers } = data;

    // 1. Filtriamo per formato Video
    const videoSenders = senders.filter(s => s.format.includes('video'));
    const videoReceivers = receivers.filter(r => r.format.includes('video'));

    // 2. Mappa delle connessioni attive (Receiver ID -> Sender ID)
    const currentConnections = {};
    videoReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    // 3. Funzione di Toggle Connessione
    const handleConnect = (receiver, sender, isConnected) => {
        if (isConnected) {
            // Per disconnettere in NMOS IS-05 si invia null al sender_id
            makeConnection(receiver, null);
            console.log(`Disconnessione: ${receiver.label}`);
        } else {
            // Connessione al nuovo sender
            makeConnection(receiver, sender);
            console.log(`Connessione: ${receiver.label} -> ${sender.label}`);
        }
    };

    return (
        <div className="matrix-page">
            <div className="matrix-toolbar">
                <h3>Video Routing Matrix (IS-05)</h3>
            </div>
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

export default MatrixVideo;
