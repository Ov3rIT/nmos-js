import { Box, Button, Typography } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';

import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

import makeConnection from '../../components/makeConnection';
import dataProvider from '../../dataProvider';
import { checkCompatibility } from './nmosCompatibility';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);
    const notify = useNotify();
    const refresh = useRefresh();

    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    // receiverId -> senderId (stato reale IS-05 $active)
    const [connections, setConnections] = useState({});

    // evita race condition se arrivano più refresh ravvicinati
    const loadSeq = useRef(0);

    const primaryColor = 'rgb(2, 112, 101)';
    const lightBg = 'rgb(245, 252, 251)';

    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    // Map flowsById per fallback (sender.flow_id -> flow.format)
    const flowsById = useMemo(() => {
        const map = {};
        normalize(data?.flows).forEach(f => {
            if (f?.id) map[f.id] = f;
        });
        return map;
    }, [data]);

    // Liste filtrate per UI (Video/Audio/Anc) — NON è la compatibilità
    const processed = useMemo(() => {
        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        const getCategoryForFilter = item => {
            const fmt = String(item.format || '').toLowerCase();
            const label = String(item.label || '').toLowerCase();

            if (
                fmt.includes('video') ||
                label.includes('video') ||
                label.includes('vid')
            )
                return 'Video';
            if (
                fmt.includes('audio') ||
                label.includes('audio') ||
                label.includes('aud')
            )
                return 'Audio';
            return 'Anc';
        };

        const senders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategoryForFilter(s) }))
            .filter(s => activeFilters[s.cat])
            .sort(sortAlpha);

        const receivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategoryForFilter(r) }))
            .filter(r => activeFilters[r.cat])
            .sort(sortAlpha);

        return {
            senders,
            receivers,
            devices: normalize(data?.devices),
        };
    }, [data, activeFilters]);

    /**
     * Legge lo stato reale IS-05: per ogni receiver prende $active.sender_id
     * e aggiorna "connections" così le icone tornano corrette.
     */
    useEffect(() => {
        let cancelled = false;
        const seq = ++loadSeq.current;

        const loadActiveConnections = async () => {
            try {
                const receivers = processed.receivers || [];
                if (!receivers.length) {
                    setConnections({});
                    return;
                }

                const results = await Promise.all(
                    receivers.map(async r => {
                        try {
                            const resp = await dataProvider(
                                'GET_ONE',
                                'receivers',
                                { id: r.id }
                            );
                            const senderId =
                                resp?.data?.$active?.sender_id ?? null;
                            return [r.id, senderId];
                        } catch (e) {
                            // se un device non risponde, non bloccare tutto
                            return [r.id, null];
                        }
                    })
                );

                if (cancelled || seq !== loadSeq.current) return;

                const map = {};
                results.forEach(([rid, sid]) => {
                    map[rid] = sid;
                });
                setConnections(map);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Impossibile leggere $active per i receiver:', e);
            }
        };

        loadActiveConnections();

        return () => {
            cancelled = true;
        };
    }, [processed.receivers]);

    /**
     * Click matrice:
     * - check compatibilità formato (IS-04 format + fallback flow.format) prima del patch
     * - se ok: makeConnection(..., 'active')
     * - poi ricarica stato $active per aggiornare le icone
     */
    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            // Nella tua MatrixBase il click su una cella "attiva" passa shouldConnect=false.
            // Qui mantengo il comportamento: se clicchi su una cella già connessa, lo trattiamo come "non implementato".
            // Se vuoi anche il disconnect reale, te lo aggiungo in modo vendor-agnostico.
            if (!shouldConnect) {
                notify(
                    '⛔ Disconnessione non implementata in questa versione',
                    'info'
                );
                return;
            }

            // 1) check formato prima di patchare
            const { ok, reason } = checkCompatibility(
                sender,
                receiver,
                flowsById
            );
            if (!ok) {
                notify(`❌ ${reason}`, 'warning');
                return;
            }

            // 2) patch/activate usando la pipeline standard nmos-js
            await makeConnection(sender.id, receiver.id, 'active');

            notify('✅ Connessione attivata', 'info');

            // 3) refresh react-admin (risorse IS-04)
            refresh();

            // 4) ricarica subito $active per aggiornare le icone senza aspettare
            //    (stessa logica del useEffect, ma immediata sul receiver interessato)
            try {
                const resp = await dataProvider('GET_ONE', 'receivers', {
                    id: receiver.id,
                });
                const senderId = resp?.data?.$active?.sender_id ?? null;
                setConnections(prev => ({ ...prev, [receiver.id]: senderId }));
            } catch {
                // se non riesce, non bloccare: il useEffect riallineerà al prossimo giro
                setConnections(prev => ({ ...prev, [receiver.id]: sender.id }));
            }
        } catch (error) {
            const body = error?.body;
            if (body?.error) {
                notify(
                    `${body.error} - ${body.code} - ${body.debug}`,
                    'warning'
                );
            } else {
                notify(String(error?.message || error), 'warning');
            }
            // eslint-disable-next-line no-console
            console.error('❌ Errore connect:', error);
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
                <Typography
                    variant="h6"
                    style={{ color: theme?.palette?.text?.primary }}
                >
                    NMOS MATRIX CONTROL
                </Typography>

                <Box>
                    {['Video', 'Audio', 'Anc'].map(cat => (
                        <Button
                            key={cat}
                            variant={
                                activeFilters[cat] ? 'contained' : 'outlined'
                            }
                            style={{ marginRight: 8 }}
                            onClick={() =>
                                setActiveFilters(prev => ({
                                    ...prev,
                                    [cat]: !prev[cat],
                                }))
                            }
                        >
                            {cat}
                        </Button>
                    ))}
                </Box>
            </Box>

            <MatrixBase
                senders={processed.senders}
                receivers={processed.receivers}
                devices={processed.devices}
                connections={connections}
                onConnect={handleConnect}
                primaryColor={primaryColor}
                lightBg={lightBg}
            />
        </Box>
    );
};

export default MatrixVideo;
