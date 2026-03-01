import { Box, Button, Typography } from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';
import { useConfirm, useNotify, useRefresh } from 'react-admin';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

import makeConnection from '../../components/makeConnection';
import dataProvider from '../../dataProvider';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);
    const notify = useNotify();
    const refresh = useRefresh();
    const confirm = useConfirm();

    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    // receiverId -> senderId
    const [connections, setConnections] = useState({});

    const primaryColor = 'rgb(2, 112, 101)';
    const lightBg = 'rgb(245, 252, 251)';

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
     * Abilita un sender via IS-05 se serve (master_enable=false).
     * - mostra un confirm pop-up
     * - se confermato: UPDATE senders con staged.master_enable=true + activate_immediate
     */
    const enableSenderIfNeeded = async (senderId, senderLabel) => {
        const { data: sender } = await dataProvider('GET_ONE', 'senders', {
            id: senderId,
        });

        // Se il device non espone il campo, assumiamo "enabled"
        const enabled = get(sender, '$active.master_enable');
        if (enabled === undefined || enabled === true) return;

        // Pop-up
        await confirm({
            title: 'Sender disabilitato',
            content: `Il sender "${senderLabel || senderId}" risulta disabilitato (master_enable=false). Vuoi abilitarlo e procedere con la connessione?`,
        });

        const patchData = cloneDeep(sender);
        set(patchData, '$staged.master_enable', true);
        set(patchData, '$staged.activation.mode', 'activate_immediate');
        set(patchData, '$staged.activation.requested_time', null);

        await dataProvider('UPDATE', 'senders', {
            id: senderId,
            data: patchData,
            previousData: sender,
        });

        notify('✅ Sender abilitato', 'info');
    };

    /**
     * Disconnect (vendor-agnostico):
     * stage sender_id=null + master_enable=false + activation immediate
     */
    const disconnectReceiver = async receiverId => {
        const { data: receiver } = await dataProvider('GET_ONE', 'receivers', {
            id: receiverId,
        });

        const patchData = cloneDeep(receiver);
        set(patchData, '$staged.sender_id', null);
        set(patchData, '$staged.master_enable', false);
        set(patchData, '$staged.activation.mode', 'activate_immediate');
        set(patchData, '$staged.activation.requested_time', null);

        await dataProvider('UPDATE', 'receivers', {
            id: receiverId,
            data: patchData,
            previousData: receiver,
        });
    };

    /**
     * Click matrice:
     * - se connect:
     *   - prova makeConnection(...,'active')
     *   - se fallisce perché sender non enabled => popup => abilita => retry
     * - se disconnect: staged clear + activate
     */
    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            if (shouldConnect) {
                try {
                    await makeConnection(sender.id, receiver.id, 'active');
                } catch (err) {
                    const msg = String(err?.message || err);

                    // makeConnection rifiuta se endpoint=active e sender non enabled
                    if (msg.toLowerCase().includes('sender is not enabled')) {
                        await enableSenderIfNeeded(sender.id, sender.label);
                        await makeConnection(sender.id, receiver.id, 'active'); // retry dopo enable
                    } else {
                        throw err;
                    }
                }

                setConnections(prev => ({ ...prev, [receiver.id]: sender.id }));
                notify('✅ Connessione attivata', 'info');
            } else {
                await disconnectReceiver(receiver.id);
                setConnections(prev => ({ ...prev, [receiver.id]: null }));
                notify('⛔ Disconnesso', 'info');
            }

            refresh();
        } catch (error) {
            // Se l'utente annulla il confirm, react-admin lancia un errore: non trattarlo come failure
            const msg = String(error?.message || error);
            if (
                msg.toLowerCase().includes('cancel') ||
                msg.toLowerCase().includes('canceled')
            ) {
                notify('Operazione annullata', 'info');
                return;
            }

            // Stile error handling “nmos-js”: se arriva body.error mostralo
            const body = error?.body;
            if (body?.error) {
                notify(
                    `${body.error} - ${body.code} - ${body.debug}`,
                    'warning'
                );
            } else {
                notify(msg, 'warning');
            }
            // log utile
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
