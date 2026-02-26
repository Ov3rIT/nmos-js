import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixMain = ({ data }) => {
    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    // Mappatura connessioni esistenti (IS-05)
    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // --- CONTROLLO DI SICUREZZA (Punto 2) ---
        // Verifichiamo che i formati coincidano
        const sFormat = (sender.format || '').toLowerCase();
        const rFormat = (
            receiver.format ||
            receiver.caps?.format ||
            ''
        ).toLowerCase();

        // Estraiamo il tipo base (video, audio, o data/ancillary)
        const getBaseType = f => {
            if (f.includes('video')) return 'video';
            if (f.includes('audio')) return 'audio';
            return 'ancillary';
        };

        if (getBaseType(sFormat) !== getBaseType(rFormat)) {
            alert(
                `Errore di Patch: Impossibile collegare un flusso ${getBaseType(sFormat)} a un ingresso ${getBaseType(rFormat)}.`
            );
            return;
        }

        makeConnection(receiver, sender);
    };

    return (
        <div className="matrix-page-wrapper">
            <div className="matrix-info-bar">
                <span>
                    🟢 Connessioni attive:{' '}
                    {Object.keys(currentConnections).length}
                </span>
            </div>
            <MatrixBase
                devices={allDevices}
                senders={allSenders}
                receivers={allReceivers}
                connections={currentConnections}
                onConnect={handleToggleConnection}
            />
        </div>
    );
};

export default MatrixMain;
