import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    // 1. Normalizzazione dei dati: React-Admin può restituire sia Array che Oggetti (mappe ID)
    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    // 2. Filtraggio Video
    // Cerchiamo 'video' nel campo format, ma gestiamo anche valori nulli o formati NMOS estesi
    const videoSenders = allSenders.filter(
        s => s && s.format && s.format.toLowerCase().includes('video')
    );

    const videoReceivers = allReceivers.filter(
        r =>
            r &&
            ((r.format && r.format.toLowerCase().includes('video')) ||
                (r.caps &&
                    r.caps.format &&
                    r.caps.format.toLowerCase().includes('video')))
    );

    // 3. Mappatura Connessioni (IS-05)
    // Creiamo un oggetto dove la chiave è l'ID del receiver e il valore è l'ID del sender collegato
    const currentConnections = {};
    videoReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    // 4. Logica di Connessione/Disconnessione
    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            // Se è già connesso, inviamo null per fare il "Disconnect"
            console.log(
                `Patch Panel: Disconnessione Receiver ${receiver.label || receiver.id}`
            );
            makeConnection(receiver, null);
        } else {
            // Altrimenti eseguiamo la connessione IS-05
            console.log(
                `Patch Panel: Connessione ${sender.label} -> ${receiver.label}`
            );
            makeConnection(receiver, sender);
        }
    };

    // 5. Stato Vuoto (Fallback se i filtri non trovano nulla)
    if (videoSenders.length === 0 && videoReceivers.length === 0) {
        return (
            <div
                style={{
                    padding: '50px',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #ddd',
                    margin: '20px',
                }}
            >
                <h3>Nessun flusso Video trovato</h3>
                <p>
                    I dati sono stati caricati, ma nessun Sender o Receiver è
                    marcato come "video".
                </p>
                <p style={{ fontSize: '11px' }}>
                    Trovati: {allSenders.length} Senders totali,{' '}
                    {allReceivers.length} Receivers totali.
                </p>
            </div>
        );
    }

    return (
        <div className="matrix-page-wrapper">
            <MatrixBase
                devices={allDevices}
                senders={videoSenders}
                receivers={videoReceivers}
                connections={currentConnections}
                onConnect={handleToggleConnection}
            />
        </div>
    );
};

export default MatrixVideo;
