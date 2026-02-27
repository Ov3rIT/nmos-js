import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    // Utility per trasformare i dati in array validi
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    // Funzione che gestisce il click sulla cella della matrice
    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // --- FIX PER UNDEFINED ---
        // Se receiver.node_id è undefined, cerchiamo l'oggetto originale completo
        // usando l'id del receiver nell'elenco totale dei receiver caricati
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        console.log('Dati Receiver per Patch:', fullReceiver);

        const nodeId = fullReceiver.node_id;

        if (!nodeId) {
            console.error(
                'ERRORE: Il receiver non ha un node_id associato.',
                fullReceiver
            );
            alert(
                'Errore tecnico: Il dispositivo non ha fornito un ID di riferimento (Node ID).'
            );
            return;
        }

        // 1. Cerchiamo il Node
        const node = allNodes.find(n => n.id === nodeId);

        let control_href = '';

        if (node && node.api && node.api.endpoints) {
            const ep = node.api.endpoints[0];
            const version =
                node.api.versions && node.api.versions.includes('v1.1')
                    ? 'v1.1'
                    : 'v1.0';
            control_href = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}`;
        } else if (node && node.href) {
            control_href = `${node.href}x-nmos/connection/v1.0`;
        }

        if (!control_href) {
            console.error(
                'Mapping fallito per il nodo:',
                nodeId,
                'Nodi disponibili:',
                allNodes
            );
            alert(`Impossibile trovare l'IP per il nodo: ${nodeId}`);
            return;
        }

        // --- ESECUZIONE PATCH ---
        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [{ href: control_href }],
        };

        console.log(`>>> INVIO PATCH A: ${control_href}`);
        makeConnection(enrichedReceiver, sender);
    };

    // Creiamo la mappa delle connessioni attive per colorare i quadratini nella matrice
    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription && r.subscription.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
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
