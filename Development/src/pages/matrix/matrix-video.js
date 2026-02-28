import React, { useCallback, useEffect, useState } from 'react';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    // Stato per le connessioni attive { [receiverId]: senderId }
    const [connections, setConnections] = useState({});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allNodes = normalize(data?.nodes);
    const allDevices = normalize(data?.devices);

    // 1. Sincronizzazione iniziale con i dati del Registry (HTTP)
    useEffect(() => {
        const initialMap = {};
        allReceivers.forEach(recv => {
            if (recv.subscription?.sender_id) {
                initialMap[recv.id] = recv.subscription.sender_id;
            }
        });
        setConnections(initialMap);
    }, [data.receivers]);

    // 2. Gestione WebSocket Real-Time
    useEffect(() => {
        const wsUrl =
            'ws://172.16.1.110:8011/x-nmos/query/v1.3/subscriptions/131230a2-c19d-47b3-98ae-e0a59013ea02';
        const ws = new WebSocket(wsUrl);

        ws.onmessage = event => {
            try {
                const grains = JSON.parse(event.data);
                // Il tuo WS ritorna un array di oggetti con 'pre' e 'post'
                if (Array.isArray(grains)) {
                    const updates = {};
                    grains.forEach(grain => {
                        if (grain.post && grain.post.id) {
                            // Prendiamo il sender_id aggiornato dal 'post'
                            updates[grain.post.id] =
                                grain.post.subscription?.sender_id || null;
                        }
                    });

                    if (Object.keys(updates).length > 0) {
                        setConnections(prev => ({ ...prev, ...updates }));
                    }
                }
            } catch (err) {
                console.error('Errore parsing WS:', err);
            }
        };

        ws.onopen = () => console.log('NMOS Live Sync: Connected');
        ws.onerror = e => console.error('NMOS Live Sync: Error', e);

        return () => ws.close();
    }, []);

    // 3. Azione di Commutazione (PATCH)
    const handleToggleConnection = async (receiver, sender, isConnected) => {
        // Troviamo il nodo per capire l'endpoint IS-05
        const fullReceiver = allReceivers.find(
            r => r.id === (receiver.id || receiver)
        );
        const node = allNodes.find(n => n.id === fullReceiver?.node_id);

        if (!node || !node.api?.endpoints) {
            console.error('Endpoint IS-05 non trovato per questo ricevitore');
            return;
        }

        const ep = node.api.endpoints[0];
        // Costruzione URL IS-05 Connection Management
        const url = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/v1.0/single/receivers/${fullReceiver.id}/staged`;

        const body = {
            sender_id: isConnected ? null : sender.id || sender,
            master_enable: true,
            activation: { mode: 'activate_immediate' },
        };

        try {
            console.log(
                `Invio comando: ${isConnected ? 'Disconnetti' : 'Connetti'}`
            );
            await fetch(url, {
                method: 'PATCH',
                // Usiamo text/plain per evitare preflight CORS se necessario
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(body),
            });
            // Nota: Non aggiorniamo lo stato qui. Aspettiamo il WebSocket per la conferma "vera".
        } catch (err) {
            alert('Errore durante la commutazione. Controlla la console.');
            console.error(err);
        }
    };

    return (
        <MatrixBase
            devices={allDevices}
            senders={allSenders}
            receivers={allReceivers}
            connections={connections}
            onConnect={handleToggleConnection}
        />
    );
};

export default MatrixVideo;
