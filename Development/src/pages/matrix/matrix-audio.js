import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixAudio = ({ data }) => {
    // Normalizzazione sicura dei dati
    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    // FILTRO AUDIO CON PROTEZIONE (Qui c'era l'errore)
    // Usiamo ?.includes per evitare crash se format è null/undefined
    const audioSenders = allSenders.filter(s =>
        s?.format?.toLowerCase().includes('audio')
    );

    const audioReceivers = allReceivers.filter(
        r =>
            r?.format?.toLowerCase().includes('audio') ||
            r?.caps?.format?.toLowerCase().includes('audio')
    );

    // Mappatura Connessioni IS-05
    const currentConnections = {};
    audioReceivers.forEach(r => {
        if (r?.subscription?.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
        } else {
            makeConnection(receiver, sender);
        }
    };

    if (audioSenders.length === 0 && audioReceivers.length === 0) {
        return (
            <div
                style={{ padding: '50px', textAlign: 'center', color: '#666' }}
            >
                <h3>Nessun flusso Audio trovato</h3>
                <p style={{ fontSize: '11px' }}>
                    Trovati: {allSenders.length} Senders totali.
                </p>
            </div>
        );
    }

    return (
        <div className="matrix-page-wrapper">
            <MatrixBase
                devices={allDevices}
                senders={audioSenders}
                receivers={audioReceivers}
                connections={currentConnections}
                onConnect={handleToggleConnection}
            />
        </div>
    );
};

export default MatrixAudio;
