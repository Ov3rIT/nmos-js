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
        // 1. Recupero oggetto completo per avere i metadati NMOS (caps, transport, ecc.)
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // 2. Risoluzione Nodo (fondamentale perché makeConnection usa i control_endpoints)
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            if (dev) nodeId = dev.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);

        if (!node || !node.api?.endpoints) {
            console.error(
                'Nodo non trovato per il receiver:',
                fullReceiver.label
            );
            return;
        }

        // 3. Costruzione dell'oggetto conforme alla libreria
        // makeConnection.js scansiona questo array cercando l'API di Connection Management
        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';

        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [
                {
                    // La libreria concatena automaticamente le rotte se l'href è corretto
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: fullReceiver.transport || 'urn:x-nmos:transport:rtp',
                },
            ],
        };

        console.log(
            `Lancio makeConnection per ${enrichedReceiver.label} verso ${sender?.label || 'PARKING'}`
        );

        // 4. Esecuzione tramite la funzione originale del repository
        // Se sender è null, la libreria gestisce automaticamente la disconnessione
        makeConnection(enrichedReceiver, isConnected ? null : sender)
            .then(() => {
                console.log('SUCCESS: Operazione completata dalla libreria.');
            })
            .catch(err => {
                // Se qui vedi ancora "Invalid endpoint", significa che il 'type' nell'endpoint
                // non coincide esattamente con il 'transport' del receiver nel Registry.
                console.error('ERRORE LIBRERIA:', err);
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
