import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allFlows = normalize(data?.flows);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    // 1. LOGICA DI ILLUMINAZIONE (Verde = Connesso)
    // Creiamo un oggetto dove la chiave è l'ID del receiver e il valore è l'ID del sender collegato
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        // Leggiamo la sottoscrizione attuale dal Registry IS-04
        const activeSenderId = receiver.subscription?.sender_id;
        if (activeSenderId) {
            currentConnections[receiver.id] = activeSenderId;
        }
    });

    // 2. LOGICA DI CONNESSIONE
    const handleToggleConnection = (receiver, sender, isConnected) => {
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // Risoluzione IP del Nodo
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            nodeId = dev?.node_id;
        }
        const node = allNodes.find(n => n.id === nodeId);

        if (!node || !node.api?.endpoints) {
            console.error('Endpoint di controllo non trovato per questo nodo.');
            return;
        }

        const ep = node.api.endpoints[0];
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';

        // Costruiamo l'oggetto arricchito per soddisfare makeConnection.js
        // Forziamo il transport per evitare "Invalid endpoint"
        const transportType =
            fullReceiver.transport || 'urn:x-nmos:transport:rtp';

        const enrichedReceiver = {
            ...fullReceiver,
            transport: transportType,
            control_endpoints: [
                {
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: transportType,
                },
            ],
        };

        // Esecuzione tramite libreria originale del progetto
        // Se isConnected è true, stiamo cliccando su un verde -> disconnettiamo (passando null)
        makeConnection(enrichedReceiver, isConnected ? null : sender)
            .then(() => {
                console.log('Comando inviato con successo.');
            })
            .catch(err => {
                console.error('Errore libreria makeConnection:', err);
            });
    };

    return (
        <MatrixBase
            devices={allDevices}
            senders={allSenders}
            receivers={allReceivers}
            connections={currentConnections} // Qui passiamo le connessioni attive per il verde
            onConnect={handleToggleConnection}
        />
    );
};

export default MatrixVideo;
