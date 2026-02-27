import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    // Normalizzazione dei dati in arrivo dal Registry
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    /**
     * Gestisce la connessione/disconnessione tra un Sender e un Receiver
     */
    const handleToggleConnection = (receiver, sender, isConnected) => {
        // 1. Recupero oggetto completo per accedere ai metadati
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // 2. Risoluzione del Nodo per trovare l'IP di controllo (IS-05)
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            if (dev) nodeId = dev.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);
        if (!node || !node.api?.endpoints) {
            console.error(
                'Impossibile trovare il nodo di controllo per:',
                fullReceiver.label
            );
            alert('Errore: Endpoint di controllo non trovato nel Registry.');
            return;
        }

        // 3. Selezione dell'endpoint e della versione API
        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';

        // 4. FIX "Invalid Endpoint": Forziamo il transport type
        // La libreria richiede che receiver.transport e endpoint.type siano identici.
        const transportType =
            fullReceiver.transport || 'urn:x-nmos:transport:rtp';

        const enrichedReceiver = {
            ...fullReceiver,
            transport: transportType, // Iniettiamo il campo se mancante
            control_endpoints: [
                {
                    // L'URL base per la Connection Management API
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: transportType,
                },
            ],
        };

        console.log(`>>> Esecuzione Patch IS-05 su ${enrichedReceiver.label}`);
        console.log(
            `>>> Target: ${sender ? sender.label : 'DISCONNECT (Parking)'}`
        );

        // 5. Chiamata alla libreria makeConnection
        // Se isConnected è true, passiamo null per eseguire il "parking" (disconnessione)
        makeConnection(enrichedReceiver, isConnected ? null : sender)
            .then(() => {
                console.log(
                    '>>> SUCCESS: Comando inviato correttamente al dispositivo.'
                );
            })
            .catch(err => {
                console.error('>>> ERRORE LIBRERIA:', err);
                if (err === 'Invalid endpoint') {
                    console.warn(
                        'Il check di validazione è fallito. Controlla la console per i tipi di trasporto.'
                    );
                } else {
                    alert(
                        'Errore durante la connessione. Verifica i permessi CORS nel browser.'
                    );
                }
            });
    };

    // Mappatura delle connessioni attuali per colorare i quadratini della matrice
    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    return (
        <MatrixBase
            devices={allDevices}
            senders={allSenders}
            receivers={allReceivers}
            connections={currentConnections}
            onConnect={handleToggleConnection}
        />
    );
};

export default MatrixVideo;
