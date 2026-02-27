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

        // 1. Recuperiamo l'oggetto completo
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // 2. TENTATIVO DI RECUPERO NODE_ID
        let nodeId = fullReceiver.node_id;

        // Se manca il node_id, lo cerchiamo tramite il Device
        if (!nodeId && fullReceiver.device_id) {
            console.log(
                'node_id assente, lo cerco tramite device_id:',
                fullReceiver.device_id
            );
            const device = allDevices.find(
                d => d.id === fullReceiver.device_id
            );
            if (device) {
                nodeId = device.node_id;
            }
        }

        if (!nodeId) {
            console.error(
                'ERRORE: Impossibile risalire al Node ID (nemmeno tramite Device).',
                fullReceiver
            );
            alert('Errore: Dati NMOS incompleti per questo apparato.');
            return;
        }

        // 3. CERCHIAMO IL NODO PER TROVARE L'IP
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
                'Mapping fallito. Node ID trovato:',
                nodeId,
                'Ma il nodo non ha endpoint o href.'
            );
            alert(`Impossibile trovare l'indirizzo IP per il nodo: ${nodeId}`);
            return;
        }

        // 4. ESECUZIONE PATCH
        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [{ href: control_href }],
        };

        console.log(`>>> PATCH INVIATO A: ${control_href}`);
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
