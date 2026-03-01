import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Typography,
} from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';
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

    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    const [connections, setConnections] = useState({});

    // ---- Dialog state ----
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [pendingSenderLabel, setPendingSenderLabel] = useState('');

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
            if (fmt.includes('audio') || label.includes('audio'))
                return 'Audio';
            if (fmt.includes('video') || label.includes('video'))
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

    // ---- Enable sender ----
    const enableSender = async senderId => {
        const { data: sender } = await dataProvider('GET_ONE', 'senders', {
            id: senderId,
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
    };

    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            if (!shouldConnect) {
                notify('⛔ Disconnesso', 'info');
                return;
            }

            try {
                await makeConnection(sender.id, receiver.id, 'active');
                notify('✅ Connessione attivata', 'info');
            } catch (err) {
                const msg = String(err?.message || err);

                if (msg.toLowerCase().includes('sender is not enabled')) {
                    // Apri dialog
                    setPendingAction(() => async () => {
                        await enableSender(sender.id);
                        await makeConnection(sender.id, receiver.id, 'active');
                        notify(
                            '✅ Sender abilitato e connessione attivata',
                            'info'
                        );
                        refresh();
                    });
                    setPendingSenderLabel(sender.label);
                    setConfirmOpen(true);
                    return;
                } else {
                    throw err;
                }
            }

            setConnections(prev => ({
                ...prev,
                [receiver.id]: sender.id,
            }));

            refresh();
        } catch (error) {
            notify(String(error?.message || error), 'warning');
            console.error(error);
        }
    };

    const handleConfirmYes = async () => {
        setConfirmOpen(false);
        if (pendingAction) await pendingAction();
        setPendingAction(null);
    };

    const handleConfirmNo = () => {
        setConfirmOpen(false);
        setPendingAction(null);
        notify('Operazione annullata', 'info');
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

            {/* -------- CONFIRM DIALOG -------- */}
            <Dialog open={confirmOpen} onClose={handleConfirmNo}>
                <DialogTitle>Sender disabilitato</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Il sender "{pendingSenderLabel}" è disabilitato. Vuoi
                        abilitarlo e procedere con la connessione?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmNo}>Annulla</Button>
                    <Button
                        onClick={handleConfirmYes}
                        color="primary"
                        variant="contained"
                    >
                        Abilita e Connetti
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MatrixVideo;
