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

        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const device = allDevices.find(
                d => d.id === fullReceiver.device_id
            );
            if (device) nodeId = device.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);

        // Costruiamo l'indirizzo base e determiniamo la versione
        let host = '172.16.1.231'; // Default basato sui tuoi log precedenti
        let port = 8001;
        let protocol = 'http';

        if (
            node &&
            node.api &&
            node.api.endpoints &&
            node.api.endpoints.length > 0
        ) {
            host = node.api.endpoints[0].host;
            port = node.api.endpoints[0].port;
            protocol = node.api.endpoints[0].protocol || 'http';
        }

        // COSTRUZIONE "TANK" DELL'ENDPOINT
        // Iniettiamo tutte le varianti possibili che makeConnection potrebbe cercare
        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [
                {
                    href: `${protocol}://${host}:${port}/x-nmos/connection/v1.0/`,
                    type: 'urn:x-nmos:transport:rtp',
                    protocol: protocol,
                    host: host,
                    port: port,
                },
                {
                    // Variante v1.1 spesso cercata dai nuovi nodi Lynx
                    href: `${protocol}://${host}:${port}/x-nmos/connection/v1.1/`,
                    type: 'urn:x-nmos:transport:rtp',
                    protocol: protocol,
                    host: host,
                    port: port,
                },
            ],
        };

        console.log(
            'Tentativo Connection con endpoint strutturato:',
            enrichedReceiver.control_endpoints
        );

        // Se makeConnection continua a dare "Invalid Endpoint",
        // significa che sta cercando una corrispondenza esatta con il campo 'transport' del receiver
        if (fullReceiver.transport) {
            enrichedReceiver.control_endpoints[0].type = fullReceiver.transport;
            enrichedReceiver.control_endpoints[1].type = fullReceiver.transport;
        }

        makeConnection(enrichedReceiver, sender)
            .then(() => console.log('SUCCESS: Patch eseguito.'))
            .catch(err => {
                console.error('ERRORE CRITICO:', err);
                // Se arriviamo qui con "Invalid endpoint", dobbiamo bypassare makeConnection
                // e fare una fetch PATCH direttamente dal componente.
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
