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
        const registryIp = '172.16.1.110'; // IP del tuo Registry
        const registryPort = '8010';

        try {
            // 1. Chiamata al Registry per ottenere i dettagli del DEVICE
            console.log(
                `🔍 Risoluzione device per receiver: ${receiver.label}...`
            );
            const deviceResponse = await fetch(
                `http://${registryIp}:${registryPort}/x-nmos/query/v1.3/devices/${receiver.device_id}`
            );

            if (!deviceResponse.ok)
                throw new Error('Device non trovato nel Registry');

            const deviceData = await deviceResponse.json();

            // 2. Estrazione dell'URL IS-05 dai controlli del Device
            // Cerchiamo preferibilmente la v1.1, altrimenti la v1.0
            const control =
                deviceData.controls?.find(
                    c => c.type === 'urn:x-nmos:control:sr-ctrl/v1.1'
                ) ||
                deviceData.controls?.find(
                    c => c.type === 'urn:x-nmos:control:sr-ctrl/v1.0'
                );

            if (!control) {
                console.error(
                    '❌ Il device non espone controlli IS-05 (sr-ctrl)'
                );
                return;
            }

            // 3. Costruzione dell'URL finale verso il DEVICE reale
            // Puliamo l'href da eventuali slash finali e aggiungiamo il percorso standard
            const baseIs05 = control.href.replace(/\/$/, '');
            const finalEndpoint = `${baseIs05}/single/receivers/${receiver.id}/staged`;

            console.log(`📡 Puntando al Device Reale: ${finalEndpoint}`);

            const payload = {
                sender_id: shouldConnect ? sender.id : null,
                master_enable: true,
                activation: { mode: 'activate_immediate' },
            };

            // 4. Esecuzione della PATCH reale sul Device
            const patchResponse = await fetch(finalEndpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (patchResponse.ok) {
                setConnections(prev => ({
                    ...prev,
                    [receiver.id]: shouldConnect ? sender.id : null,
                }));
                console.log('✅ Patch eseguita con successo sul device!');
            } else {
                console.error(
                    `❌ Errore Patch Device (${patchResponse.status})`
                );
            }
        } catch (error) {
            console.error('❌ Errore nel processo di patching:', error.message);
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
