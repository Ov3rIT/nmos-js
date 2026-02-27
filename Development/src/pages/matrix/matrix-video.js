import React from 'react';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    // FUNZIONE DI PATCH DIRETTA (IS-05)
    const performNmosPatch = async (receiver, sender) => {
        // 1. Risoluzione Nodo (Receiver -> Device -> Node)
        let nodeId = receiver.node_id;
        if (!nodeId && receiver.device_id) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            nodeId = dev?.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);
        if (!node || !node.api?.endpoints) {
            console.error('Dati nodo non trovati per:', nodeId);
            alert(
                "Errore: Impossibile trovare l'endpoint di controllo del dispositivo."
            );
            return;
        }

        // Costruiamo l'URL del comando
        const ep = node.api.endpoints[0];
        const patchUrl = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/v1.0/single/receivers/${receiver.id}/target`;

        // 2. Preparazione Body NMOS
        const patchBody = {
            sender_id: sender ? sender.id : null,
            master_enable: true,
            activation: { mode: 'activate_immediate' },
        };

        console.log('>>> TENTATIVO PATCH DIRETTO A:', patchUrl);

        // 3. Esecuzione Chiamata
        try {
            const response = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patchBody),
            });

            if (response.ok || response.status === 202) {
                console.log(
                    '>>> SUCCESS: Commutazione eseguita correttamente.'
                );
            } else {
                alert(`Errore Dispositivo: ${response.status}`);
            }
        } catch (err) {
            console.error('ERRORE DI RETE (Probabile CORS):', err);
            alert(
                'Errore CORS: Il browser blocca la chiamata al dispositivo Lynx. Vedi console per dettagli.'
            );
        }
    };

    const handleToggleConnection = (receiver, sender, isConnected) => {
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;
        if (isConnected) {
            performNmosPatch(fullReceiver, null); // Disconnetti
        } else {
            performNmosPatch(fullReceiver, sender); // Connetti
        }
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
