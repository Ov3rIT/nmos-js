import { Box, Button, Typography } from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';

import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

import makeConnection from '../../components/makeConnection';
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

    // receiverId -> senderId (solo per UI; se vuoi allinearla allo stato reale, possiamo leggerlo da IS-05 $active)
    const [connections, setConnections] = useState({});

    const primaryColor = 'rgb(2, 112, 101)';
    const lightBg = 'rgb(245, 252, 251)';

    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    // Map flows by id per fallback su flow.format
    const flowsById = useMemo(() => {
        const map = {};
        normalize(data?.flows).forEach(f => {
            if (f?.id) map[f.id] = f;
        });
        return map;
    }, [data]);

    const processed = useMemo(() => {
        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        const getCategoryForFilter = item => {
            const fmt = String(item.format || '').toLowerCase();
            const label = String(item.label || '').toLowerCase();

            // filtro UI (non è la compatibilità: quella la facciamo con nmosCompatibility)
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
     * Click matrice:
     * - prima check compatibilità sender/receiver (IS-04 format + fallback flow.format)
     * - se ok -> makeConnection(..., 'active')
     * - se no -> notify + stop
     */
    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            if (!shouldConnect) {
                // Se vuoi la logica di disconnect, dimmelo e la reinseriamo in modo vendor-agnostico.
                notify(
                    '⛔ Disconnessione non implementata in questa versione',
                    'info'
                );
                return;
            }

            // 1) check prima del patch
            const { ok, reason } = checkCompatibility(
                sender,
                receiver,
                flowsById
            );
            if (!ok) {
                notify(`❌ ${reason}`, 'warning');
                return;
            }

            // 2) connect/activate via pipeline standard di nmos-js
            await makeConnection(sender.id, receiver.id, 'active');

            // 3) aggiorna stato UI
            setConnections(prev => ({ ...prev, [receiver.id]: sender.id }));
            notify('✅ Connessione attivata', 'info');
            refresh();
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
