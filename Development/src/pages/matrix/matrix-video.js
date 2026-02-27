import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);
    const allNodes = normalize(data?.nodes);

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // 1. Recupero oggetto completo dallo store per avere i metadati originali
        const fullReceiver =
            allReceivers.find(r => r.id === receiver.id) || receiver;

        // 2. Risoluzione Nodo e IP
        let nodeId = fullReceiver.node_id;
        if (!nodeId && fullReceiver.device_id) {
            const dev = allDevices.find(d => d.id === fullReceiver.device_id);
            if (dev) nodeId = dev.node_id;
        }

        const node = allNodes.find(n => n.id === nodeId);
        if (!node || !node.api?.endpoints) {
            console.error(
                "Dati del Nodo non trovati per l'endpoint di controllo."
            );
            return;
        }

        const ep = node.api.endpoints[0];
        // Determiniamo la versione supportata dal Lynx
        const version =
            node.api.versions && node.api.versions.includes('v1.1')
                ? 'v1.1'
                : 'v1.0';

        // 3. COSTRUZIONE ENDPOINT - IL FIX DECISIVO
        // makeConnection.js filtra gli endpoint basandosi su fullReceiver.transport.
        // Lo forziamo qui per garantire il match.
        const transportType =
            fullReceiver.transport || 'urn:x-nmos:transport:rtp';

        const enrichedReceiver = {
            ...fullReceiver,
            control_endpoints: [
                {
                    // Nota: L'URL deve finire con lo slash per alcune versioni della libreria
                    href: `${ep.protocol}://${ep.host}:${ep.port}/x-nmos/connection/${version}/`,
                    type: transportType,
                },
            ],
        };

        console.log(`Lancio makeConnection per: ${enrichedReceiver.label}`);
        console.log(
            `Endpoint Type: ${transportType} | Receiver Transport: ${fullReceiver.transport}`
        );

        // 4. Esecuzione tramite libreria
        // Passiamo null a sender se vogliamo disconnettere (isConnected è true)
        makeConnection(enrichedReceiver, isConnected ? null : sender)
            .then(() => {
                console.log('SUCCESS: Operazione IS-05 completata.');
            })
            .catch(err => {
                console.error('ERRORE LIBRERIA:', err);
                if (err === 'Invalid endpoint') {
                    console.warn(
                        "La libreria non accetta l'endpoint. Verifica che fullReceiver.transport sia presente."
                    );
                }
            });
    };

    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id) {
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
