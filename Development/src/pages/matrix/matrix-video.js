import { Box, Button, Typography } from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';
import { ThemeContext } from '../../theme/ThemeContext';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });
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
            if (
                fmt.includes('data') ||
                fmt.includes('mux') ||
                label.includes('anc')
            )
                return 'Anc';
            return 'Video';
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

    // LOGICA DI PATCHING DINAMICA
    const handleConnect = async (receiver, sender, shouldConnect) => {
        const registryIp = '172.16.1.110';
        const registryPort = '8010';
        const registryBase = `http://${registryIp}:${registryPort}/x-nmos/query/v1.3`;

        try {
            // --- STEP 1: RISOLUZIONE DEVICE DEL RECEIVER ---
            console.log(`🔍 Risoluzione device per: ${receiver.label}`);
            const devRes = await fetch(
                `${registryBase}/devices/${receiver.device_id}`
            );
            if (!devRes.ok) throw new Error('Device ricevente non trovato');
            const devData = await devRes.json();

            const control = devData.controls?.find(c =>
                c.type.includes('sr-ctrl')
            );
            if (!control) throw new Error('Il device non supporta IS-05');

            const is05Endpoint = `${control.href.replace(/\/$/, '')}/single/receivers/${receiver.id}/staged`;

            let payload = {
                master_enable: true,
                activation: { mode: 'activate_immediate' },
            };

            if (shouldConnect) {
                // --- STEP 2: RECUPERO INFO SENDER ---
                const senderRes = await fetch(
                    `${registryBase}/senders/${sender.id}`
                );
                if (!senderRes.ok)
                    throw new Error('Dettagli sender non trovati');
                const senderData = await senderRes.json();

                if (!senderData.manifest_href)
                    throw new Error('Il sender non ha manifest_href');

                // --- STEP 3: DOWNLOAD E PULIZIA SDP ---
                console.log(`📄 Download SDP da: ${senderData.manifest_href}`);
                const sdpRes = await fetch(senderData.manifest_href);
                if (!sdpRes.ok) throw new Error('Errore download SDP');
                let sdpText = await sdpRes.text();

                // Pulizia: Rimuoviamo eventuali righe di log della curl (es. "shutting down...")
                // Teniamo solo le righe che iniziano con una lettera seguita da "=" (standard SDP)
                sdpText = sdpText
                    .split('\n')
                    .filter(line => /^[a-z]=/.test(line.trim()))
                    .join('\n');

                console.log('✅ SDP Semplificato:\n', sdpText);

                payload = {
                    ...payload,
                    sender_id: sender.id,
                    transport_file: {
                        data: sdpText,
                        type: 'application/sdp',
                    },
                };
            } else {
                payload.sender_id = null;
                payload.transport_file = null;
            }

            // --- STEP 4: PATCH AL DEVICE ---
            const patchRes = await fetch(is05Endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (patchRes.ok) {
                setConnections(prev => ({
                    ...prev,
                    [receiver.id]: shouldConnect ? sender.id : null,
                }));
                console.log('✅ SDP Injected successfully!');
            } else {
                const err = await patchRes.text();
                console.error('❌ Device Patch Error:', err);
            }
        } catch (error) {
            console.error('❌ Errore:', error.message);
        }
    };

    return (
        <Box
            style={{
                backgroundColor: lightBg,
                color: '#333',
                padding: '20px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box display="flex" alignItems="center" mb={2} gap="10px">
                <Typography
                    variant="button"
                    style={{ color: primaryColor, fontWeight: 'bold' }}
                >
                    Filtri:
                </Typography>
                {['Video', 'Audio', 'Anc'].map(cat => (
                    <Button
                        key={cat}
                        variant={activeFilters[cat] ? 'contained' : 'outlined'}
                        style={{
                            backgroundColor: activeFilters[cat]
                                ? primaryColor
                                : 'transparent',
                            color: activeFilters[cat] ? '#fff' : primaryColor,
                            borderColor: primaryColor,
                        }}
                        size="small"
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

            <Box
                style={{
                    flex: 1,
                    overflow: 'auto',
                    border: `1px solid ${primaryColor}44`,
                    borderRadius: '4px',
                }}
            >
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
