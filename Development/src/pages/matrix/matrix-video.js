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

    const handleToggleConnection = (receiver, sender, isConnected) => {
        // 1. Debug: Vediamo cosa c'è dentro il receiver
        console.log('DEBUG Receiver:', receiver);
        console.log('DEBUG Sender:', sender);

        if (isConnected) {
            makeConnection(receiver, null);
            return;
        }

        // 2. Controllo Coerenza
        if (getBaseType(sender) !== getBaseType(receiver)) {
            alert('Errore: Formati non compatibili!');
            return;
        }

        // 3. Costruzione oggetto "Safe" per makeConnection
        // Molti componenti nmos-js cercano 'control_endpoints' o 'href'
        const safeReceiver = {
            ...receiver,
            // Se control_endpoints è un array di oggetti, assicuriamoci che sia leggibile
            // nmos-js si aspetta spesso: [{ address: "...", type: "..." }]
        };

        // Se mancano gli endpoint nel receiver, proviamo a prenderli dal device
        if (
            !safeReceiver.control_endpoints ||
            safeReceiver.control_endpoints.length === 0
        ) {
            const dev = allDevices.find(d => d.id === receiver.device_id);
            if (dev && dev.control_endpoints) {
                safeReceiver.control_endpoints = dev.control_endpoints;
            }
        }

        // 4. Esecuzione
        if (
            !safeReceiver.control_endpoints ||
            safeReceiver.control_endpoints.length === 0
        ) {
            console.error(
                'ERRORE: Questo receiver non ha endpoint IS-05 definiti!'
            );
            alert(
                'Errore: Il dispositivo non supporta il controllo IS-05 (Endpoint mancante).'
            );
            return;
        }

        makeConnection(safeReceiver, sender);
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
