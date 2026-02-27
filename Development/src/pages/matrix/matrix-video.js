import React from 'react';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    // FUNZIONE DI PATCH MANUALE (Bypassa makeConnection.js)
    const manualNmosPatch = async (receiver, sender) => {
        // 1. Trova l'IP del Nodo
        let nodeId = receiver.node_id;
        if (!nodeId && receiver.device_id) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev) nodeId = dev.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);
        if (!node || !node.api || !node.api.endpoints) {
            alert("Errore: Impossibile trovare l'IP del nodo di controllo.");
            return;
        }

        const ep = node.api.endpoints[0];
        // Costruiamo l'URL finale per il comando IS-05
        const patchUrl = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/v1.0/single/receivers/${receiver.id}/target`;

        console.log('>>> INVIO PATCH MANUALE A:', patchUrl);

        // 2. Preparazione del Body (Standard NMOS IS-05)
        const body = {
            sender_id: sender ? sender.id : null, // Se sender è null, facciamo il "parking"
            master_enable: true,
            activation: { mode: 'activate_immediate' },
        };

        // 3. Esecuzione della chiamata HTTP
        try {
            const response = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok || response.status === 202) {
                console.log('>>> COMMUTAZIONE ESEGUITA CON SUCCESSO!');
            } else {
                const errorText = await response.text();
                console.error('Errore dal dispositivo:', errorText);
                alert(
                    `Il dispositivo ha risposto con errore: ${response.status}`
                );
            }
        } catch (err) {
            console.error('Errore di rete durante il Patch:', err);
            alert(
                'Errore di rete: Controlla che il dispositivo sia raggiungibile e che non ci siano blocchi CORS.'
            );
        }
    };

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // Recuperiamo l'oggetto completo per sicurezza
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        if (isConnected) {
            manualNmosPatch(fullReceiver, null); // Disconnetti
        } else {
            manualNmosPatch(fullReceiver, sender); // Connetti
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
