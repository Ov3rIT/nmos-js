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
            // --- STEP 1: RISOLUZIONE DEVICE (IS-04) ---
            console.log(`🔍 Risoluzione device per: ${receiver.label}`);
            const devRes = await fetch(
                `${registryBase}/devices/${receiver.device_id}`
            );
            if (!devRes.ok) throw new Error('Device non trovato');
            const devData = await devRes.json();

            const control = devData.controls?.find(c =>
                c.type.includes('sr-ctrl')
            );
            if (!control) throw new Error('Il device non supporta IS-05');

            const is05Endpoint = `${control.href.replace(/\/$/, '')}/single/receivers/${receiver.id}/staged`;

            // PREPARAZIONE PAYLOAD BASE
            let payload = {
                master_enable: true,
                activation: { mode: 'activate_immediate' },
            };

            if (shouldConnect) {
                // --- STEP 2: RECUPERO SDP DAL SENDER (IS-04) ---
                console.log(`📡 Recupero Flow per sender: ${sender.label}`);
                // Un sender ha un flow_id associato
                const flowRes = await fetch(
                    `${registryBase}/flows/${sender.flow_id}`
                );
                if (!flowRes.ok)
                    throw new Error('Flow non trovato per questo sender');
                const flowData = await flowRes.json();

                if (!flowData.manifest_href)
                    throw new Error('SDP non disponibile per questo flow');

                // --- STEP 3: DOWNLOAD DEL CONTENUTO SDP ---
                console.log(
                    `📄 Scaricamento SDP da: ${flowData.manifest_href}`
                );
                const sdpRes = await fetch(flowData.manifest_href);
                if (!sdpRes.ok)
                    throw new Error('Impossibile scaricare il file SDP');
                const sdpText = await sdpRes.text();

                // --- STEP 4: COSTRUZIONE PAYLOAD CON SDP ---
                payload = {
                    ...payload,
                    sender_id: sender.id,
                    transport_file: {
                        data: sdpText,
                        type: 'application/sdp',
                    },
                };
            } else {
                // DISCONNESSIONE
                payload.sender_id = null;
            }

            // --- STEP 5: PATCH FINALE AL DEVICE ---
            console.log(`🚀 Iniezione SDP su: ${is05Endpoint}`);
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
                console.log('✅ Connessione SDP completata!');
            } else {
                const err = await patchRes.text();
                console.error('❌ Errore Patch Device:', err);
            }
        } catch (error) {
            console.error('❌ Errore critico:', error.message);
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
