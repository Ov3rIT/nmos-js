import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // 1. Recupero oggetto completo
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // 2. Risoluzione Node ID (tramite receiver o device)
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const device = allDevices.find(
                d => d.id === fullReceiver.device_id
            );
            if (device) nodeId = device.node_id;
        }

        // 3. Trova il Nodo e costruisci l'URL
        const node = allNodes.find(n => n.id === nodeId);
        let baseUrl = '';

        if (node && node.api && node.api.endpoints) {
            const ep = node.api.endpoints[0];
            // NOTA: Molte librerie aggiungono /x-nmos/... internamente,
            // ma Lynx spesso richiede l'URL completo. Proviamo la forma standard:
            baseUrl = `${ep.protocol}://${ep.host}:${ep.port}`;
        }

        if (!baseUrl) {
            alert("Errore: Impossibile mappare l'IP del dispositivo.");
            return;
        }

        // 4. COSTRUZIONE ENDPOINT PER SUPERARE LA VALIDAZIONE
        // makeConnection.js spesso cerca un endpoint con tipo specifico
        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [
                {
                    href: `${baseUrl}/x-nmos/connection/v1.0`,
                    type: 'urn:x-nmos:transport:rtp',
                    protocol: 'http',
                },
                {
                    // Fallback per versioni che cercano l'host pulito
                    host: baseUrl.split('://')[1].split(':')[0],
                    port: parseInt(baseUrl.split(':')[2]),
                    protocol: 'http',
                },
            ],
        };

        console.log(
            'Tentativo connessione verso:',
            enrichedReceiver.control_endpoints[0].href
        );

        // Chiamata alla funzione originale
        makeConnection(enrichedReceiver, sender)
            .then(() => console.log('Connessione riuscita!'))
            .catch(err => {
                console.error('Dettaglio Errore:', err);
                // Se fallisce ancora, il problema potrebbe essere la versione API (v1.0 vs v1.1)
            });
    };

    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id)
            currentConnections[r.id] = r.subscription.sender_id;
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
