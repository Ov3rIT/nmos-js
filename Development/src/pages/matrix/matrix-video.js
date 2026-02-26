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
        if (isConnected) {
            // Per disconnettere, nmos-js di solito vuole null o un oggetto vuoto
            makeConnection(receiver, null);
            return;
        }

        // Controllo coerenza tipo (Audio con Audio, ecc.)
        if (getBaseType(sender) !== getBaseType(receiver)) {
            alert('Errore: I tipi di segnale non corrispondono!');
            return;
        }

        // --- FIX ENDPOINT ---
        // Se l'endpoint manca nel receiver, cerchiamo di recuperarlo dal Device
        let finalReceiver = { ...receiver };
        if (
            !finalReceiver.control_endpoints ||
            finalReceiver.control_endpoints.length === 0
        ) {
            const parentDevice = allDevices.find(
                d => d.id === receiver.device_id
            );
            if (parentDevice && parentDevice.control_endpoints) {
                finalReceiver.control_endpoints =
                    parentDevice.control_endpoints;
            }
        }

        console.log(
            'Tentativo di patch su endpoint:',
            finalReceiver.control_endpoints
        );

        try {
            // Eseguiamo la connessione
            makeConnection(finalReceiver, sender);
        } catch (e) {
            console.error('Errore chiamata makeConnection:', e);
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
