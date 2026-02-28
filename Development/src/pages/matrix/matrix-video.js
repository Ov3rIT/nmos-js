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

    // 1. Identificazione connessioni attive per il colore VERDE
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        if (receiver.subscription?.sender_id) {
            currentConnections[receiver.id] = receiver.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // Recuperiamo l'oggetto originale
        const rawReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;
        const fullSender = isConnected
            ? null
            : allSenders.find(s => s.id === sender.id);

        // --- IL FIX PER "INVALID ENDPOINT" ---
        // Se il Registry non ci dà i control_endpoints, dobbiamo ricostruirli
        // andando a pescare l'IP dal Nodo corrispondente.

        let nodeId = rawReceiver.node_id;
        if (!nodeId && rawReceiver.device_id) {
            const dev = allDevices.find(d => d.id === rawReceiver.device_id);
            nodeId = dev?.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);

        if (!node || !node.api?.endpoints) {
            console.error(
                "Impossibile trovare il Nodo per ricavare l'endpoint di controllo."
            );
            return;
        }

        // Prendiamo l'endpoint di Connection Management (IS-05) dal Nodo
        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';
        const transport = rawReceiver.transport || 'urn:x-nmos:transport:rtp';

        // Costruiamo l'oggetto "Enriched" che emula perfettamente il comportamento NMOS
        const fullReceiver = {
            ...rawReceiver,
            transport: transport,
            control_endpoints: [
                {
                    // Questo è il formato esatto che la libreria cerca internamente
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: transport,
                },
            ],
        };

        console.log(
            `Tentativo IS-05 per ${fullReceiver.label} tramite ${fullReceiver.control_endpoints[0].href}`
        );

        // Ora chiamiamo makeConnection come fa ConnectButtons.js alla riga 21
        makeConnection(fullReceiver, fullSender)
            .then(() => {
                console.log('>>> SUCCESS: Commutazione inviata!');
            })
            .catch(err => {
                console.error('Errore libreria makeConnection:', err);
                // Se arriviamo qui, il problema potrebbe essere il CORS o la rete
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
