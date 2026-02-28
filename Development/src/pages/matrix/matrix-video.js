import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);

    // 1. Calcolo Connessioni Attive (Illuminazione Verde)
    // Usiamo la sottoscrizione reale del receiver come nel resto dell'app
    const currentConnections = {};
    allReceivers.forEach(receiver => {
        if (receiver.subscription?.sender_id) {
            currentConnections[receiver.id] = receiver.subscription.sender_id;
        }
    });

    // 2. Logica di connessione identica a ConnectButtons.js riga 21
    const handleToggleConnection = (receiver, sender, isConnected) => {
        // Recuperiamo gli oggetti completi dal nostro "store" (data)
        // Questo garantisce che abbiano tutti i campi (caps, control_endpoints, transport, ecc.)
        const fullReceiver = allReceivers.find(r => r.id === receiver.id);
        const fullSender = isConnected
            ? null
            : allSenders.find(s => s.id === sender.id);

        console.log(
            `Tentativo di ${isConnected ? 'Disconnessione' : 'Connessione'} per:`,
            fullReceiver.label
        );

        // Chiamata identica a: makeConnection(receiver, sender)
        // Se fullSender è null, la libreria esegue il "parking" (disconnessione)
        makeConnection(fullReceiver, fullSender)
            .then(() => {
                console.log('Operazione completata con successo (IS-05)');
            })
            .catch(err => {
                console.error('Errore durante makeConnection:', err);
                // Se vedi ancora Invalid Endpoint qui, significa che il Registry
                // non sta fornendo i control_endpoints nel JSON del receiver.
            });
    };

    return (
        <MatrixBase
            devices={data.devices}
            senders={allSenders}
            receivers={allReceivers}
            connections={currentConnections}
            onConnect={handleToggleConnection}
        />
    );
};

export default MatrixVideo;
