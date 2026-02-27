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
        // Se è già connesso, inviamo null per fare il "Parking" (disconnessione)
        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // --- RISOLUZIONE ENDPOINT DI CONTROLLO (IS-05) ---
        // 1. Cerchiamo il Node a cui appartiene il Receiver
        const node = allNodes.find(n => n.id === receiver.node_id);

        let control_href = '';

        if (node && node.api && node.api.endpoints) {
            // Prendiamo il primo endpoint disponibile (solitamente porta 8001 per Lynx)
            const ep = node.api.endpoints[0];
            const version =
                node.api.versions && node.api.versions.includes('v1.1')
                    ? 'v1.1'
                    : 'v1.0';
            control_href = `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}`;
        } else if (node && node.href) {
            control_href = `${node.href}x-nmos/connection/v1.0`;
        }

        // Se non troviamo l'IP del nodo, non possiamo procedere
        if (!control_href) {
            console.error('Mapping fallito per il nodo:', receiver.node_id);
            alert(
                "Errore: Impossibile trovare l'indirizzo IP del dispositivo di destinazione."
            );
            return;
        }

        // --- ESECUZIONE PATCH ---
        const enrichedReceiver = {
            ...receiver,
            control_endpoints: [{ href: control_href }],
        };

        console.log(`>>> INVIO PATCH A: ${control_href}`);
        console.log(
            `>>> DESTINAZIONE: ${receiver.label} | SORGENTE: ${sender.label}`
        );

        try {
            makeConnection(enrichedReceiver, sender);
        } catch (err) {
            console.error('Errore durante la connessione:', err);
            alert("Errore nell'invio del comando IS-05.");
        }
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
