import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    // Estrazione sicura dei dati con fallback ad array vuoti
    const senders = data?.senders || [];
    const receivers = data?.receivers || [];
    const devices = data?.devices || [];

    // Filtriamo i Sender Video
    // In NMOS il formato può essere 'video' o 'urn:x-nmos:format:video'
    const videoSenders = senders.filter(s => {
        const format = s.format || '';
        return format.toLowerCase().includes('video');
    });

    // Filtriamo i Receiver Video
    const videoReceivers = receivers.filter(r => {
        // Alcuni receiver NMOS definiscono il formato nei caps (capabilities)
        const format = r.format || (r.caps && r.caps.format) || '';
        return format.toLowerCase().includes('video');
    });

    // Mappatura delle connessioni attive per la griglia
    // NMOS IS-05: il receiver ha una 'subscription' con il sender_id collegato
    const currentConnections = {};
    videoReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    // Gestione del click sulla cella (Connect / Disconnect)
    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            // Disconnessione: inviamo null come sender al tuo componente makeConnection
            console.log(`Disconnessione: ${receiver.label || receiver.id}`);
            makeConnection(receiver, null);
        } else {
            // Connessione: inviamo l'oggetto sender selezionato
            console.log(
                `Connessione: ${receiver.label || receiver.id} -> ${sender.label || sender.id}`
            );
            makeConnection(receiver, sender);
        }
    };

    // Se dopo il filtro non ci sono dati, mostriamo un feedback visivo
    if (videoSenders.length === 0 && videoReceivers.length === 0) {
        return (
            <div
                style={{ padding: '40px', textAlign: 'center', color: '#888' }}
            >
                <h3>Nessun flusso Video rilevato</h3>
                <p>
                    Assicurati che i dispositivi siano registrati correttamente
                    nel Registry NMOS.
                </p>
            </div>
        );
    }

    return (
        <div className="matrix-page-content">
            <MatrixBase
                devices={devices}
                senders={videoSenders}
                receivers={videoReceivers}
                connections={currentConnections}
                onConnect={handleToggleConnection}
            />
        </div>
    );
};

export default MatrixVideo;
