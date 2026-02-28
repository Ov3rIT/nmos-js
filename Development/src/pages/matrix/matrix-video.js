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

    // Configurazione Centralizzata NMOS-CPP (Docker)
    const REGISTRY_IP = '172.16.1.110';
    const REGISTRY_PORT = '8010';
    const NMOS_BASE_URL = `http://${REGISTRY_IP}:${REGISTRY_PORT}/x-nmos`;

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

    // LOGICA DI PATCHING TRAMITE NMOS-CPP (SDP INJECTION)
    const handleConnect = async (receiver, sender, shouldConnect) => {
        try {
            // 1. Definiamo l'endpoint IS-05 tramite il Registry nmos-cpp
            // Nota: Puntiamo al receiver ID attraverso il Connection Management del Registry
            const is05Endpoint = `${NMOS_BASE_URL}/connection/v1.1/single/receivers/${receiver.id}/staged`;

            let payload = {
                master_enable: true,
                activation: { mode: 'activate_immediate' },
            };

            if (shouldConnect) {
                console.log(
                    `📡 Recupero manifest per il sender: ${sender.label}`
                );

                // 2. Recuperiamo il manifest_href dal sender (interrogando IS-04)
                const senderRes = await fetch(
                    `${NMOS_BASE_URL}/query/v1.3/senders/${sender.id}`
                );
                if (!senderRes.ok)
                    throw new Error(
                        'Errore recupero dettagli sender dal Registry'
                    );
                const senderData = await senderRes.json();

                if (!senderData.manifest_href)
                    throw new Error(
                        'Il sender non espone un URL SDP (manifest_href)'
                    );

                // 3. Scarichiamo l'SDP (il browser lo permette se nmos-cpp ha il CORS attivo)
                console.log(`📄 Download SDP da: ${senderData.manifest_href}`);
                const sdpRes = await fetch(senderData.manifest_href);
                if (!sdpRes.ok)
                    throw new Error('Impossibile scaricare il file SDP');
                let sdpText = await sdpRes.text();

                // Pulizia minima dell'SDP (rimozione righe di log/commenti non standard)
                sdpText = sdpText
                    .split('\n')
                    .filter(line => /^[a-z]=/.test(line.trim()))
                    .join('\n');

                // 4. Prepariamo il payload con transport_file (SDP)
                payload = {
                    ...payload,
                    sender_id: sender.id,
                    transport_file: {
                        data: sdpText,
                        type: 'application/sdp',
                    },
                };
            } else {
                // Logica di disconnessione
                payload.sender_id = null;
                payload.transport_file = null;
            }

            // 5. Invio della PATCH al Docker nmos-cpp
            console.log(`🚀 Invio PATCH IS-05 a nmos-cpp: ${is05Endpoint}`);
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
                console.log(
                    '✅ Connessione stabilita con successo tramite nmos-cpp'
                );
            } else {
                const errText = await patchRes.text();
                console.error(
                    `❌ Errore nella Patch (${patchRes.status}):`,
                    errText
                );
            }
        } catch (error) {
            console.error(
                '❌ Errore critico durante il patching:',
                error.message
            );
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
            <Box display="flex" alignItems="center" mb={2} gridGap={10}>
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
