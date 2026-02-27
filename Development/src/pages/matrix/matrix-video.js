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
    const allNodes = normalize(data?.nodes);

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // 1. Cerchiamo il nodo associato
        let node = allNodes.find(n => n.id === receiver.node_id);

        // 2. Se non lo trova per ID, cerchiamo per corrispondenza nel Device
        if (!node) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev) node = allNodes.find(n => n.id === dev.node_id);
        }

        let control_endpoints = [];

        // 3. Estrazione Endpoint (Logica specifica per Lynx CDE1922)
        if (node?.api?.endpoints) {
            control_endpoints = node.api.endpoints.map(ep => ({
                host: ep.host,
                port: ep.port,
                protocol: ep.protocol || 'http',
                href: `${ep.protocol || 'http'}://${ep.host}:${ep.port}/x-nmos/connection/v1.0`,
            }));
        }

        // FALLBACK DISPERATO: Se il mapping fallisce ancora, usiamo l'IP del sender come base
        // (Spesso i nodi Lynx hanno le API sulla stessa subnet)
        if (
            control_endpoints.length === 0 &&
            sender.description?.includes('172.')
        ) {
            const guessedIp = sender.description.match(/\d+\.\d+\.\d+\.\d+/);
            if (guessedIp) {
                control_endpoints = [
                    {
                        href: `http://${guessedIp[0]}:8001/x-nmos/connection/v1.0`,
                    },
                ];
            }
        }

        if (control_endpoints.length === 0) {
            console.error(
                'Mapping fallito. Receiver:',
                receiver,
                'Nodes:',
                allNodes
            );
            alert(
                "Errore: Impossibile mappare l'API del nodo. Verifica la console (F12)."
            );
            return;
        }

        const enrichedReceiver = { ...receiver, control_endpoints };
        console.log('>>> PATCHING VERSO:', control_endpoints[0].href);

        makeConnection(enrichedReceiver, sender);
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
