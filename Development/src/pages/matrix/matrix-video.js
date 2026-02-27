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

    const getBaseType = item => {
        if (!item) return 'unknown';
        const val = (item.format || item.caps?.format || '').toLowerCase();
        if (val.includes('video')) return 'video';
        if (val.includes('audio')) return 'audio';
        return 'ancillary';
    };

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

        // --- 1. RECUPERO URL DALL'API DEL NODE (Specifico Lynx) ---
        let control_endpoints = [];
        const node = allNodes.find(n => n.id === receiver.node_id);

        if (node && node.api && node.api.endpoints) {
            // Trasformiamo gli endpoints del nodo nel formato richiesto da IS-05
            control_endpoints = node.api.endpoints.map(ep => ({
                host: ep.host,
                port: ep.port,
                protocol: ep.protocol || 'http',
                // Costruiamo l'href standard NMOS Connection Management
                href: `${ep.protocol || 'http'}://${ep.host}:${ep.port}/x-nmos/connection/${node.api.versions.includes('v1.1') ? 'v1.1' : 'v1.0'}`,
            }));
        }

        if (control_endpoints.length === 0) {
            alert("Errore: Impossibile mappare l'API di controllo dal Node.");
            return;
        }

        // --- 2. PREPARAZIONE OGGETTI ---
        const enrichedReceiver = {
            ...receiver,
            control_endpoints: control_endpoints,
        };

        console.log(`Esecuzione Patch su: ${control_endpoints[0].href}`);

        try {
            makeConnection(enrichedReceiver, sender);
        } catch (err) {
            console.error('Errore IS-05:', err);
        }
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
