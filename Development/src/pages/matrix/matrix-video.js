import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);

    // Stato per i filtri di categoria
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    // Stato per i dispositivi collassati (nascosti)
    const [collapsedDevices, setCollapsedDevices] = useState([]);
    const [connections, setConnections] = useState({});

    // Funzione per nascondere/mostrare un dispositivo cliccato
    const handleNodeToggle = deviceId => {
        setCollapsedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const toggleFilter = label => {
        setActiveFilters(prev => ({ ...prev, [label]: !prev[label] }));
    };

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

        // Filtriamo i nodi in base ai filtri categoria e ai nodi "collassati"
        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .filter(
                s =>
                    activeFilters[s.cat] &&
                    !collapsedDevices.includes(s.device_id)
            )
            .sort(sortAlpha);

        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .filter(
                r =>
                    activeFilters[r.cat] &&
                    !collapsedDevices.includes(r.device_id)
            )
            .sort(sortAlpha);

        return {
            senders: allSenders,
            receivers: allReceivers,
            devices: normalize(data?.devices),
            nodes: normalize(data?.nodes),
            allReceivers: normalize(data?.receivers),
        };
    }, [data, activeFilters, collapsedDevices]);

    // Sync iniziale e WebSocket
    useEffect(() => {
        const initialMap = {};
        processed.allReceivers.forEach(recv => {
            if (recv.subscription?.sender_id)
                initialMap[recv.id] = recv.subscription.sender_id;
        });
        setConnections(initialMap);
    }, [processed.allReceivers]);

    useEffect(() => {
        const wsUrl =
            'ws://172.16.1.110:8011/x-nmos/query/v1.3/subscriptions/131230a2-c19d-47b3-98ae-e0a59013ea02';
        const ws = new WebSocket(wsUrl);
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
        <div
            style={{
                backgroundColor: theme.background,
                color: theme.text,
                padding: '20px',
                minHeight: '100vh',
            }}
        >
            <div
                style={{
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                }}
            >
                <span
                    style={{
                        fontSize: '12px',
                        color: theme.primary,
                        fontWeight: 'bold',
                    }}
                >
                    FILTRI:
                </span>
                {['Video', 'Audio', 'Anc'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => toggleFilter(cat)}
                        style={{
                            padding: '6px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            border: `1px solid ${theme.primary}`,
                            backgroundColor: activeFilters[cat]
                                ? theme.primary
                                : 'transparent',
                            color: activeFilters[cat] ? '#000' : theme.text,
                            fontWeight: 'bold',
                        }}
                    >
                        {cat}
                    </button>
                ))}
                {collapsedDevices.length > 0 && (
                    <button
                        onClick={() => setCollapsedDevices([])}
                        style={{
                            marginLeft: 'auto',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        MOSTRA TUTTI ({collapsedDevices.length})
                    </button>
                )}
            </div>

            <div
                style={{
                    overflow: 'auto',
                    border: `1px solid ${theme.border}`,
                }}
            >
                <MatrixBase
                    senders={processed.senders}
                    receivers={processed.receivers}
                    devices={processed.devices}
                    nodes={processed.nodes}
                    connections={connections}
                    onConnect={() => {}}
                    onNodeClick={handleNodeToggle} // Passiamo la funzione di toggle
                />
            </div>
        </div>
    );
};

export default MatrixVideo;
