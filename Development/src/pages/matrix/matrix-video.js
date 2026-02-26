import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    // Funzione per capire il tipo di flusso (Video, Audio, Data)
    const getBaseType = item => {
        const format = (item?.format || item?.caps?.format || '').toLowerCase();
        if (format.includes('video')) return 'video';
        if (format.includes('audio')) return 'audio';
        return 'ancillary';
    };

    // Mappatura connessioni attive (IS-05)
    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            console.log('Disconnecting...');
            makeConnection(receiver, null);
            return;
        }

        // --- CONTROLLO DI SICUREZZA (Patch dello stesso tipo) ---
        const sType = getBaseType(sender);
        const rType = getBaseType(receiver);

        if (sType !== rType) {
            alert(
                `Errore: Impossibile patchare un flusso ${sType.toUpperCase()} su un ingresso ${rType.toUpperCase()}.`
            );
            return;
        }

        // --- TENTATIVO DI PATCH ---
        console.log(
            `Connecting ${sender.label} to ${receiver.label} (${sType})`
        );

        try {
            // Passiamo l'oggetto completo. Se continua a dare "Invalid Endpoint",
            // il problema è nel Registry URL configurato nell'App.
            makeConnection(receiver, sender);
        } catch (err) {
            console.error('Errore durante la chiamata IS-05:', err);
        }
    };

    return (
        <div className="matrix-page-wrapper">
            {/* Legenda rapida */}
            <div
                style={{
                    padding: '10px',
                    fontSize: '12px',
                    background: '#eee',
                    borderBottom: '1px solid #ccc',
                }}
            >
                <strong>Patch Status:</strong>{' '}
                {Object.keys(currentConnections).length} active connections
                <span style={{ marginLeft: '20px' }}>
                    {' '}
                    (Check labels to ensure matching formats)
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

export default MatrixVideo;
