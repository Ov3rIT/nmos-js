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
        // 1. Risoluzione IP del Nodo (come prima)
        let nodeId = receiver.node_id;
        if (!nodeId && receiver.device_id) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            nodeId = dev?.node_id;
        }
        const node = allNodes.find(n => n.id === nodeId);
        if (!node) return;

        const ep = node.api.endpoints[0];
        const baseUrl = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/v1.0/single/receivers/${receiver.id}`;

        try {
            let transportParams = {};

            if (sender) {
                // --- CONNESSIONE ---
                // Recuperiamo i transport_params dal sender (spesso sono nei tags o ricavabili)
                // Nota: In un'implementazione completa dovresti fare una GET al sender.
                // Qui ipotizziamo di mappare i parametri base.
                transportParams = {
                    sender_id: sender.id,
                    master_enable: true,
                    activation: { mode: 'activate_immediate' },
                    transport_params: [
                        {
                            multicast_ip: sender.manifest_href || '239.1.1.1', // Esempio: andrebbe letto dal sender
                            interface_ip: '172.16.1.10', // L'IP della tua interfaccia media
                            destination_port: 5000,
                        },
                    ],
                };
            } else {
                // --- DISCONNESSIONE (Parking) ---
                transportParams = {
                    sender_id: null,
                    master_enable: false,
                    activation: { mode: 'activate_immediate' },
                };
            }

            console.log('>>> INVIO PATCH A /staged:', transportParams);

            const response = await fetch(`${baseUrl}/staged`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transportParams),
            });

            if (response.ok) {
                console.log(
                    '>>> SUCCESS: Parametri inviati a STAGED e ATTIVATI.'
                );
            } else {
                const err = await response.text();
                console.error('Errore IS-05:', err);
            }
        } catch (err) {
            console.error('Errore di rete:', err);
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
