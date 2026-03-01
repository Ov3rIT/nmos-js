// Development/src/pages/matrix/matrix-video.js
import { Box, Typography } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';

import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

import makeConnection from '../../components/makeConnection';
import dataProvider from '../../dataProvider';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);
    const notify = useNotify();
    const refresh = useRefresh();

    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    // receiverId -> senderId (attuale, idealmente letto da $active)
    const [connections, setConnections] = useState({});

    const processed = useMemo(() => {
        const normalize = items =>
            Array.isArray(items) ? items : Object.values(items || {});
        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');
        const getCategory = item => {
            const fmt = (item.format || '').toLowerCase();
            const label = (item.label || '').toLowerCase();
            if (
                fmt.includes('audio') ||
                label.includes('audio') ||
                label.includes('aud')
            )
                return 'Audio';
            if (
                fmt.includes('video') ||
                label.includes('video') ||
                label.includes('vid')
            )
                return 'Video';
            return 'Anc';
        };

        const snds = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .filter(s => activeFilters[s.cat])
            .sort(sortAlpha);

        const rcvs = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .filter(r => activeFilters[r.cat])
            .sort(sortAlpha);

        return {
            senders: snds,
            receivers: rcvs,
            devices: normalize(data?.devices),
        };
    }, [data, activeFilters]);

    /**
     * (Opzionale ma consigliato)
     * Popola connections leggendo $active.sender_id dai receiver via GET_ONE,
     * così la matrice riflette lo stato reale dei device.
     */
    useEffect(() => {
        let cancelled = false;

        const loadActiveConnections = async () => {
            try {
                const rcvs = processed.receivers || [];
                const results = await Promise.all(
                    rcvs.map(r =>
                        dataProvider('GET_ONE', 'receivers', { id: r.id })
                            .then(resp => ({
                                id: r.id,
                                senderId: get(
                                    resp,
                                    'data.$active.sender_id',
                                    null
                                ),
                            }))
                            .catch(() => ({ id: r.id, senderId: null }))
                    )
                );

                if (cancelled) return;

                const map = {};
                results.forEach(x => {
                    map[x.id] = x.senderId;
                });
                setConnections(map);
            } catch (e) {
                // non bloccare la UI se qualche device non risponde
                console.warn(
                    'Impossibile leggere $active per tutti i receiver:',
                    e
                );
            }
        };

        loadActiveConnections();
        return () => {
            cancelled = true;
        };
    }, [processed.receivers]);

    /**
     * Disconnect: stage sender_id=null + activation immediate
     * (mini helper, simile alla logica di makeConnection ma per “clear”)
     */
    const disconnectReceiver = async receiverId => {
        const { data: receiver } = await dataProvider('GET_ONE', 'receivers', {
            id: receiverId,
        });

        const patchData = cloneDeep(receiver);
        set(patchData, '$staged.sender_id', null);
        set(patchData, '$staged.master_enable', false);
        set(patchData, '$staged.activation.mode', 'activate_immediate');

        await dataProvider('UPDATE', 'receivers', {
            id: receiverId,
            data: patchData,
            previousData: receiver,
        });
    };

    /**
     * Click su cella matrice: connect/disconnect
     * Usa makeConnection (che fa staging + transport_params + SDP se disponibile)
     */
    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            if (shouldConnect) {
                // endpoint 'active' => stage + activation immediate (come pulsante "Activate")
                await makeConnection(sender.id, receiver.id, 'active');
                setConnections(prev => ({ ...prev, [receiver.id]: sender.id }));
                notify('✅ Connessione attivata', 'info');
            } else {
                await disconnectReceiver(receiver.id);
                setConnections(prev => ({ ...prev, [receiver.id]: null }));
                notify('⛔ Disconnesso', 'info');
            }

            refresh(); // riallinea i dati react-admin
        } catch (error) {
            // stesso stile error handling di ConnectButtons
            const body = error?.body;
            if (body?.error) {
                notify(
                    `${body.error} - ${body.code} - ${body.debug}`,
                    'warning'
                );
            } else {
                notify(String(error), 'warning');
            }
            console.error('Errore connect:', error);
        }
    };

    return (
        <Box>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
            >
                <Typography variant="h6">NMOS MATRIX CONTROL</Typography>

                <Box>
                    {['Video', 'Audio', 'Anc'].map(cat => (
                        <button
                            key={cat}
                            onClick={() =>
                                setActiveFilters(prev => ({
                                    ...prev,
                                    [cat]: !prev[cat],
                                }))
                            }
                            style={{ marginRight: 8 }}
                        >
                            {cat}: {activeFilters[cat] ? 'ON' : 'OFF'}
                        </button>
                    ))}
                </Box>
            </Box>

            <MatrixBase
                senders={processed.senders}
                receivers={processed.receivers}
                devices={processed.devices}
                connections={connections}
                onConnect={handleConnect}
                primaryColor={'rgb(2, 112, 101)'}
                lightBg={'rgb(245, 252, 251)'}
            />
        </Box>
    );
};

export default MatrixVideo;
