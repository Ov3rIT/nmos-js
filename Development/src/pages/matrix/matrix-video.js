import React from 'react';
import { useSelector } from 'react-redux';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    // Recuperiamo i Nodes dallo store (spesso l'URL IS-05 è lì)
    const nodes = useSelector(state =>
        state.admin.resources.nodes?.data
            ? Object.values(state.admin.resources.nodes.data)
            : []
    );

    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    const getBaseType = item => {
        const format = (item?.format || '').toLowerCase();
        if (format.includes('video')) return 'video';
        if (format.includes('audio')) return 'audio';
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

        if (getBaseType(sender) !== getBaseType(receiver)) {
            alert('Errore: I tipi di segnale non corrispondono!');
            return;
        }

        // --- LOGICA DI RECUPERO URL (IS-05) ---
        let control_endpoints = receiver.control_endpoints || [];

        // 1. Se il receiver è vuoto, cerca nel Device
        if (control_endpoints.length === 0) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev?.control_endpoints)
                control_endpoints = dev.control_endpoints;
        }

        // 2. Se è ancora vuoto, cerca nel Node (molto comune in nmos-js)
        if (control_endpoints.length === 0) {
            const node = nodes.find(n => n.id === receiver.node_id);
            if (node?.services) {
                // NMOS IS-04: i servizi di controllo sono spesso in node.services
                const connService = node.services.find(s =>
                    s.type.includes('connection')
                );
                if (connService)
                    control_endpoints = [{ href: connService.href }];
            }
        }

        if (control_endpoints.length === 0) {
            console.error('Dati mancanti per il Receiver:', receiver);
            alert(
                "Errore: Impossibile trovare l'URL IS-05. Il dispositivo potrebbe non supportare IS-05 o i dati non sono caricati."
            );
            return;
        }

        // Creiamo l'oggetto "arricchito" da passare a makeConnection
        const enrichedReceiver = { ...receiver, control_endpoints };

        console.log('Tentativo di patch con endpoint:', control_endpoints);
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
