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

    // Stato delle connessioni (mappa receiver_id -> sender_id)
    const [connections, setConnections] = useState({});

    const primaryColor = 'rgb(2, 112, 101)';
    const lightBg = 'rgb(245, 252, 251)';

    // Elaborazione dati (Filtri e Ordinamento)
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

    // LOGICA DI PATCHING NMOS IS-05
    const handleConnect = async (receiver, sender, shouldConnect) => {
        // L'endpoint dipende dal tuo controller NMOS (es. porta 8010 o porta dell'apparecchio)
        const endpoint = `http://${window.location.hostname}:8010/x-nmos/connection/v1.1/single/receivers/${receiver.id}/staged`;

        const payload = {
            sender_id: shouldConnect ? sender.id : null,
            master_enable: true,
            activation: { mode: 'activate_immediate' },
        };

        try {
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Aggiornamento ottimistico dell'interfaccia
                setConnections(prev => ({
                    ...prev,
                    [receiver.id]: shouldConnect ? sender.id : null,
                }));
            } else {
                console.error('Errore NMOS IS-05:', response.statusText);
            }
        } catch (error) {
            console.error('Errore di rete durante la patch:', error);
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
                    onConnect={handleConnect} // Passiamo la logica reale
                    primaryColor={primaryColor}
                    lightBg={lightBg}
                />
            </Box>
        </Box>
    );
};

export default MatrixVideo;
