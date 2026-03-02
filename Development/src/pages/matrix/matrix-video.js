import { Box } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNotify, useRefresh } from 'react-admin';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

import makeConnection from '../../components/makeConnection';
import dataProvider from '../../dataProvider';
import { checkCompatibility } from './nmosCompatibility';

const TogglePill = ({ label, checked, onChange, colorOn = '#027065' }) => {
    return (
        <div
            role="switch"
            aria-checked={checked}
            tabIndex={0}
            onClick={onChange}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange();
                }
            }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                borderRadius: 999,
                userSelect: 'none',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.15)',
                backgroundColor: checked ? `${colorOn}12` : 'rgba(0,0,0,0.03)',
            }}
            title={`${label}: ${checked ? 'ON' : 'OFF'}`}
        >
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    color: 'rgba(0,0,0,0.75)',
                }}
            >
                {label}
            </span>
            <span
                style={{
                    width: 34,
                    height: 18,
                    borderRadius: 999,
                    position: 'relative',
                    backgroundColor: checked ? colorOn : 'rgba(0,0,0,0.18)',
                    transition: 'background-color 120ms linear',
                    flex: '0 0 auto',
                }}
            >
                <span
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        backgroundColor: '#fff',
                        position: 'absolute',
                        top: 2,
                        left: checked ? 18 : 2,
                        transition: 'left 120ms linear',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}
                />
            </span>
        </div>
    );
};

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

    // Ref per evitare il flickering: mantiene l'ultimo stato valido della tabella
    const lastValidProcessed = useRef({
        senders: [],
        receivers: [],
        devices: [],
    });
    const loadSeq = useRef(0);

    const primaryColor = 'rgb(2, 112, 101)';
    const lightBg = 'rgb(245, 252, 251)';

    const normalize = items =>
        Array.isArray(items) ? items : Object.values(items || {});

    const flowsById = useMemo(() => {
        const map = {};
        normalize(data?.flows).forEach(f => {
            if (f?.id) map[f.id] = f;
        });
        return map;
    }, [data]);

    const processed = useMemo(() => {
        // Se i dati sono in fase di caricamento (null o undefined),
        // restituiamo l'ultimo dato mostrato per evitare che la tabella sparisca
        if (!data || (!data.senders && !data.receivers)) {
            return lastValidProcessed.current;
        }

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

        const result = {
            senders: normalize(data?.senders)
                .map(s => ({ ...s, cat: getCategoryForFilter(s) }))
                .filter(s => activeFilters[s.cat])
                .sort(sortAlpha),
            receivers: normalize(data?.receivers)
                .map(r => ({ ...r, cat: getCategoryForFilter(r) }))
                .filter(r => activeFilters[r.cat])
                .sort(sortAlpha),
            devices: normalize(data?.devices),
        };

        lastValidProcessed.current = result;
        return result;
    }, [data, activeFilters]);

    /**
     * Carica stato reale IS-05 senza resettare lo stato ad ogni refresh
     */
    useEffect(() => {
        let cancelled = false;
        const seq = ++loadSeq.current;

        const loadActiveConnections = async () => {
            try {
                const receivers = processed.receivers || [];
                // Se non abbiamo ancora receiver, non facciamo nulla invece di svuotare
                if (receivers.length === 0) return;

                const results = await Promise.all(
                    receivers.map(async r => {
                        try {
                            const resp = await dataProvider(
                                'GET_ONE',
                                'receivers',
                                { id: r.id }
                            );
                            return [
                                r.id,
                                resp?.data?.$active?.sender_id ?? null,
                            ];
                        } catch {
                            return [r.id, null];
                        }
                    })
                );

                if (cancelled || seq !== loadSeq.current) return;

                const map = {};
                results.forEach(([rid, sid]) => {
                    map[rid] = sid;
                });

                // Aggiornamento atomico dello stato delle connessioni
                setConnections(map);
            } catch (e) {
                console.warn('Refresh connessioni fallito:', e);
            }
        };

        loadActiveConnections();
        return () => {
            cancelled = true;
        };
    }, [processed.receivers]);

    const disconnectReceiver = async receiverId => {
        const { data: receiver } = await dataProvider('GET_ONE', 'receivers', {
            id: receiverId,
        });
        const patchData = cloneDeep(receiver);
        set(patchData, '$staged.sender_id', null);
        set(patchData, '$staged.activation.mode', 'activate_immediate');
        set(patchData, '$staged.activation.requested_time', null);

        await dataProvider('UPDATE', 'receivers', {
            id: receiverId,
            data: patchData,
            previousData: receiver,
        });
    };

    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            if (!shouldConnect) {
                await disconnectReceiver(receiver.id);
                setConnections(prev => ({ ...prev, [receiver.id]: null }));
                notify('⛔ Disconnesso', 'info');
                refresh();
                return;
            }

            const { ok, reason } = checkCompatibility(
                sender,
                receiver,
                flowsById
            );
            if (!ok) {
                notify(`❌ ${reason}`, 'warning');
                return;
            }

            await makeConnection(sender.id, receiver.id, 'active');
            notify('✅ Connessione attivata', 'info');
            refresh();

            // Aggiornamento ottimistico locale per non aspettare il ciclo dei 5 secondi
            setConnections(prev => ({ ...prev, [receiver.id]: sender.id }));
        } catch (error) {
            const body = error?.body;
            notify(body?.error || String(error?.message || error), 'warning');
        }
    };

    return (
        <Box
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 64px)',
                minHeight: 0,
            }}
        >
            {/* Toolbar filtri */}
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    flex: '0 0 auto',
                }}
            >
                <TogglePill
                    label="VIDEO"
                    checked={!!activeFilters.Video}
                    onChange={() =>
                        setActiveFilters(p => ({ ...p, Video: !p.Video }))
                    }
                    colorOn={primaryColor}
                />
                <TogglePill
                    label="AUDIO"
                    checked={!!activeFilters.Audio}
                    onChange={() =>
                        setActiveFilters(p => ({ ...p, Audio: !p.Audio }))
                    }
                    colorOn={primaryColor}
                />
                <TogglePill
                    label="ANC"
                    checked={!!activeFilters.Anc}
                    onChange={() =>
                        setActiveFilters(p => ({ ...p, Anc: !p.Anc }))
                    }
                    colorOn={primaryColor}
                />
            </Box>

            {/* Area Matrix */}
            <Box style={{ flex: '1 1 auto', minHeight: 0 }}>
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
        </Box>
    );
};

export default MatrixVideo;
