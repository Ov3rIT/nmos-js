import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allNodes = normalize(data?.nodes);
    const allDevices = normalize(data?.devices);

    // Identificazione connessioni per il verde (IS-04 subscription)
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        if (receiver.subscription?.sender_id) {
            currentConnections[receiver.id] = receiver.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // 1. Recuperiamo i dati completi
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;
        const fullSender = isConnected
            ? null
            : allSenders.find(s => s.id === sender.id);

        // 2. Costruzione dell'endpoint di controllo (fondamentale per makeConnection)
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            nodeId = dev?.node_id;
        }
        const node = allNodes.find(n => n.id === nodeId);

        if (!node) return;
        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';

        // 3. Arricchimento oggetto per emulare ConnectButtons.js
        // Aggiungiamo i campi che la libreria si aspetta di trovare
        const enrichedReceiver = {
            ...fullReceiver,
            transport: fullReceiver.transport || 'urn:x-nmos:transport:rtp',
            control_endpoints: [
                {
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: fullReceiver.transport || 'urn:x-nmos:transport:rtp',
                },
            ],
        };

        console.log(
            `Esecuzione Connect (tipo: active) per ${enrichedReceiver.label}`
        );

        /**
         * Chiamata a makeConnection.
         * Nel file ConnectButtons.js, la funzione connect() chiama makeConnection.
         * Il secondo parametro è il sender, il terzo (opzionale in alcune versioni)
         * è il tipo di endpoint ('active' o 'staged').
         */
        makeConnection(enrichedReceiver, fullSender, 'active')
            .then(() => {
                console.log(">>> SUCCESS: Commutazione 'active' completata.");
            })
            .catch(err => {
                console.error('Errore makeConnection:', err);
            });
    };

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
