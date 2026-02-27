import React from 'react';
import MatrixBase from './MatrixBase';
import makeConnection from '../../components/makeConnection';

const MatrixVideo = ({ data }) => {
    const normalize = items => {
        if (!items) return [];
        return Array.isArray(items) ? items : Object.values(items);
    };

    const allSenders = normalize(data?.senders);
    const allReceivers = normalize(data?.receivers);
    const allDevices = normalize(data?.devices);

    const getBaseType = item => {
        const format = (item?.format || '').toLowerCase();
        if (format.includes('video')) return 'video';
        if (format.includes('audio')) return 'audio';
        return 'ancillary';
    };

    const currentConnections = {};
    allReceivers.forEach(r => {
        if (r.subscription?.sender_id) {
            currentConnections[r.id] = r.subscription.sender_id;
        }
    });

    const handleToggleConnection = async (receiver, sender, isConnected) => {
        // 1. Determina l'URL di controllo IS-05
        // Cerchiamo l'endpoint di tipo 'connection' v1.0 o v1.1
        const connectionEndpoint = receiver.control_endpoints?.find(ep =>
            ep.type.includes('connection')
        )?.address;

        if (!connectionEndpoint) {
            alert(
                "Errore: Impossibile trovare l'URL IS-05 per questo Receiver."
            );
            return;
        }

        // Costruiamo l'URL finale per il comando 'staged'
        // Rimuoviamo eventuale slash finale e aggiungiamo il percorso standard
        const baseUrl = connectionEndpoint.replace(/\/$/, '');
        const patchUrl = `${baseUrl}/single/receivers/${receiver.id}/staged`;

        // 2. Prepariamo il Body della richiesta (Standard IS-05)
        const body = {
            sender_id: isConnected ? null : sender.id, // Se già connesso, invia null per scollegare
            master_enable: true,
            activation: {
                mode: 'activate_immediate',
            },
        };

        try {
            console.log(`Esecuzione Patch Manuale su: ${patchUrl}`, body);

            const response = await fetch(patchUrl, {
                method: 'PATCH', // IS-05 usa PATCH o PUT a seconda della versione, PATCH è più comune per staged
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                console.log('Patch eseguito con successo!');
                // Opzionale: qui potresti forzare un refresh dei dati o mostrare un messaggio
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore del server NMOS');
            }
        } catch (err) {
            console.error('Errore API IS-05:', err);
            alert(`Errore durante il patch: ${err.message}`);
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
