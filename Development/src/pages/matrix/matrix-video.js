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

    // 1. Mappa delle connessioni attive (Verde)
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        if (receiver.subscription?.sender_id) {
            currentConnections[receiver.id] = receiver.subscription.sender_id;
        }
    });

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // Recuperiamo gli oggetti completi
        // Usiamo .id per essere sicuri di non passare l'intero oggetto dove non serve
        const fullReceiver = allReceivers.find(
            r => r.id === (receiver.id || receiver)
        );
        const fullSender = isConnected
            ? null
            : allSenders.find(s => s.id === (sender.id || sender));

        if (!fullReceiver) {
            console.error('Receiver non trovato');
            return;
        }

        // 2. Ricostruzione dell'endpoint di controllo (IS-05)
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            nodeId = dev?.node_id;
        }
        const node = allNodes.find(n => n.id === nodeId);

        if (!node || !node.api?.endpoints) {
            console.error('Nodo o Endpoint non trovato');
            return;
        }

        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';
        const transport = fullReceiver.transport || 'urn:x-nmos:transport:rtp';

        // Prepariamo l'oggetto esattamente come lo vuole makeConnection
        const receiverToConnect = {
            ...fullReceiver,
            transport: transport,
            control_endpoints: [
                {
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: transport,
                },
            ],
        };

        console.log(`Esecuzione IS-05 per: ${receiverToConnect.label}`);

        // 3. Chiamata alla libreria
        // Passiamo gli oggetti filtrati per evitare il bug [object Object] nell'URL
        makeConnection(receiverToConnect, fullSender)
            .then(() => {
                console.log('>>> SUCCESS: Patch inviato');
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
