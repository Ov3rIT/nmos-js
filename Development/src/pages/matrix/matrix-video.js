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
    const allNodes = normalize(data?.nodes); // Recuperati dal nuovo index.js

    // Funzione ultra-permissiva per rilevare il tipo
    const getBaseType = item => {
        if (!item) return 'unknown';
        // Controlla format, caps.format o transport
        const val = (
            item.format ||
            item.caps?.format ||
            item.transport ||
            ''
        ).toLowerCase();
        if (val.includes('video')) return 'video';
        if (val.includes('audio')) return 'audio';
        if (val.includes('data') || val.includes('anc')) return 'ancillary';
        return 'video'; // Fallback per sicurezza se non riconosciuto
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

        const sType = getBaseType(sender);
        const rType = getBaseType(receiver);

        console.log(`Verifica Patch: Sender(${sType}) -> Receiver(${rType})`);

        // Se uno dei due è sconosciuto, permettiamo il patch ma avvisiamo in console
        if (sType !== rType && sType !== 'unknown' && rType !== 'unknown') {
            alert(`Errore: Stai cercando di collegare ${sType} con ${rType}`);
            return;
        }

        // --- LOOKUP ENDPOINT ---
        let endpoints = receiver.control_endpoints || [];

        // Se vuoto, cerca nel Device
        if (endpoints.length === 0) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev?.control_endpoints) endpoints = dev.control_endpoints;
        }

        // Se ancora vuoto, cerca nel Node
        if (endpoints.length === 0) {
            const node = allNodes.find(n => n.id === receiver.node_id);
            if (node?.services) {
                const connService = node.services.find(s =>
                    s.type.includes('connection')
                );
                if (connService) endpoints = [{ href: connService.href }];
            }
        }

        if (endpoints.length === 0) {
            alert(
                "Errore: Impossibile trovare l'URL di controllo (IS-05). Controlla la console."
            );
            console.log('Dati del receiver incriminato:', receiver);
            return;
        }

        // nmos-js a volte richiede che l'endpoint sia iniettato così:
        const enrichedReceiver = { ...receiver, control_endpoints: endpoints };

        console.log(
            'Patch in esecuzione verso:',
            endpoints[0]?.href || endpoints[0]
        );
        makeConnection(enrichedReceiver, sender);
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
