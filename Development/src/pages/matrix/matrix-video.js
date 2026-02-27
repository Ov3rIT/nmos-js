import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allNodes = normalize(data?.nodes);

    const handleToggleConnection = (receiver, sender, isConnected) => {
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // 1. Trova l'IP del Nodo dal registro caricato dal dataProvider
        const node = allNodes.find(n => n.id === receiver.node_id);

        // 2. Costruiamo l'endpoint di controllo.
        // Se il nodo ha un href (es. http://172.16.1.231:8001/), lo usiamo.
        let control_href = '';
        if (node && node.href) {
            control_href = `${node.href}x-nmos/connection/v1.0`;
        } else if (node && node.api && node.api.endpoints) {
            const ep = node.api.endpoints[0];
            control_href = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/v1.0`;
        }

        if (!control_href) {
            console.error('Dati nodo mancanti per il receiver:', receiver);
            alert(
                "Errore: Impossibile trovare l'indirizzo IP del dispositivo Lynx."
            );
            return;
        }

        // 3. Arricchiamo il receiver con l'endpoint per far felice makeConnection
        const enrichedReceiver = {
            ...receiver,
            control_endpoints: [{ href: control_href }],
        };

        console.log('Comando IS-05 inviato a:', control_href);
        makeConnection(enrichedReceiver, sender);
    };

    // Mappa le connessioni attuali per i quadratini nella matrice
    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id)
            currentConnections[r.id] = r.subscription.sender_id;
    });

    return (
        <MatrixBase
            devices={normalize(data?.devices)}
            senders={allSenders}
            receivers={allReceivers}
            connections={currentConnections}
            onConnect={handleToggleConnection}
        />
    );
};

export default MatrixVideo;
