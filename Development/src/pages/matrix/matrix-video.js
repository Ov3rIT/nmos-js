import { Box, Button, Typography } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
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
    const darkBg = '#1e1e1e'; // Grigio molto scuro per le righe
    const nodeBg = '#2d2d2d'; // Grigio leggermente più chiaro per i nodi (se necessario)

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

    useEffect(() => {
        const rcvs = Array.isArray(data?.receivers)
            ? data.receivers
            : Object.values(data?.receivers || {});
        const initialMap = {};
        rcvs.forEach(recv => {
            if (recv.subscription?.sender_id)
                initialMap[recv.id] = recv.subscription.sender_id;
        });
        setConnections(initialMap);
    }, [data]);

    useEffect(() => {
        const ws = new WebSocket(
            'ws://172.16.1.110:8011/x-nmos/query/v1.3/subscriptions/131230a2-c19d-47b3-98ae-e0a59013ea02'
        );
        ws.onmessage = event => {
            try {
                const grains = JSON.parse(event.data);
                if (Array.isArray(grains)) {
                    const updates = {};
                    grains.forEach(g => {
                        if (g.post)
                            updates[g.post.id] =
                                g.post.subscription?.sender_id || null;
                    });
                    setConnections(prev => ({ ...prev, ...updates }));
                }
            } catch (e) {}
        };
        return () => ws.close();
    }, []);

    return (
        <Box
            style={{
                backgroundColor: '#121212',
                color: '#fff',
                padding: '20px',
                minHeight: '100vh',
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
                            color: '#fff',
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
                    border: `1px solid ${primaryColor}66`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    backgroundColor: darkBg,
                }}
            >
                <MatrixBase
                    senders={processed.senders}
                    receivers={processed.receivers}
                    devices={processed.devices}
                    connections={connections}
                    primaryColor={primaryColor}
                    darkBg={darkBg}
                    nodeBg={nodeBg}
                    onConnect={() => {}}
                />
            </Box>
        </Box>
    );
};

export default MatrixVideo;
