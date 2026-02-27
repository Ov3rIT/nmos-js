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

    // FIX TIPO: Usiamo una regex per catturare 'video', 'audio' o 'anc' dentro la stringa URN
    const getBaseType = item => {
        if (!item) return 'unknown';
        const val = (item.format || item.caps?.format || '').toLowerCase();
        if (val.includes('video')) return 'video';
        if (val.includes('audio')) return 'audio';
        if (val.includes('ancillary') || val.includes('data'))
            return 'ancillary';
        return 'unknown';
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

        // --- 1. VERIFICA TIPO (Flessibile) ---
        const sType = getBaseType(sender);
        const rType = getBaseType(receiver);
        console.log(
            `Patching: ${sender.label} (${sType}) -> ${receiver.label} (${rType})`
        );

        // Permettiamo il patch se i tipi coincidono o se uno è unknown
        if (sType !== rType && sType !== 'unknown' && rType !== 'unknown') {
            const procedi = window.confirm(
                `Attenzione: Tipi diversi (${sType} vs ${rType}). Vuoi procedere comunque?`
            );
            if (!procedi) return;
        }

        // --- 2. RECUPERO ENDPOINT (Lookup gerarchico) ---
        let endpoints = receiver.control_endpoints || [];

        // Se il receiver è vuoto, cerchiamo nel Device associato
        if (endpoints.length === 0) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev?.control_endpoints && dev.control_endpoints.length > 0) {
                endpoints = dev.control_endpoints;
            }
        }

        // Se è ancora vuoto, cerchiamo nel Node
        if (endpoints.length === 0) {
            const node = allNodes.find(n => n.id === receiver.node_id);
            if (node?.services) {
                // Cerchiamo il servizio "connection" (IS-05)
                const connService = node.services.find(s =>
                    s.type.toLowerCase().includes('connection')
                );
                if (connService) {
                    endpoints = [{ href: connService.href }];
                }
            }
        }

        // --- 3. VERIFICA FINALE ED ESECUZIONE ---
        if (endpoints.length === 0) {
            console.error('Dati ricevuti per lookup fallito:', {
                receiver,
                nodes: allNodes,
            });
            alert(
                "Errore: Impossibile trovare l'URL di controllo IS-05 per questo dispositivo."
            );
            return;
        }

        // Prepariamo l'oggetto come lo vuole makeConnection
        const enrichedReceiver = {
            ...receiver,
            control_endpoints: endpoints,
        };

        console.log('Endpoint trovato:', endpoints);

        try {
            makeConnection(enrichedReceiver, sender);
        } catch (err) {
            console.error('Errore durante makeConnection:', err);
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
