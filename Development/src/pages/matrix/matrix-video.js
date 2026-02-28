import React from 'react';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});
    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allNodes = normalize(data?.nodes);
    const allDevices = normalize(data?.devices);

    // 1. Illuminazione Verde (Basata su IS-04 subscription)
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        if (receiver.subscription?.sender_id) {
            currentConnections[receiver.id] = receiver.subscription.sender_id;
        }
    });

    const handleToggleConnection = async (receiver, sender, isConnected) => {
        const fullReceiver = allReceivers.find(
            r => r.id === (receiver.id || receiver)
        );

        // TROVA IL NODO PER L'IP DI CONTROLLO
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            nodeId = dev?.node_id;
        }
        const node = allNodes.find(n => n.id === nodeId);

        if (!node || !node.api?.endpoints) {
            alert("Errore: Impossibile trovare l'endpoint del dispositivo.");
            return;
        }

        // Costruiamo l'URL IS-05 standard (Porta e Host dal Node)
        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';
        const url = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/single/receivers/${fullReceiver.id}/staged`;

        // Payload NMOS IS-05
        const body = {
            sender_id: isConnected ? null : sender.id || sender,
            master_enable: true,
            activation: { mode: 'activate_immediate' },
        };

        console.log('>>> INVIO COMANDO IS-05 DIRETTO:', url, body);

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok || response.status === 202) {
                console.log('>>> PATCH OK: Il video dovrebbe aver commutato.');
                // ALERT DI CORTESIA (Opzionale)
                // alert(`Switch eseguito su ${fullReceiver.label}`);
            } else {
                const errTxt = await response.text();
                console.error('Errore Hardware:', errTxt);
                alert(`Errore dal decoder: ${response.status}`);
            }
        } catch (err) {
            console.error('Errore Network/CORS:', err);
            alert(
                "Errore di rete. Verifica che l'estensione 'Allow CORS' sia attiva."
            );
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
