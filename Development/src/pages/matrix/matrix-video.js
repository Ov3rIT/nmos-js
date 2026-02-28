import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);

    // Stato filtri: partiamo con tutto attivo
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    const [connections, setConnections] = useState({});

    const toggleFilter = label => {
        setActiveFilters(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const processed = useMemo(() => {
        const normalize = items => {
            if (!items) return [];
            return Array.isArray(items) ? items : Object.values(items);
        };

        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        // Categorizzazione migliorata per evitare che tutto finisca in Video
        const getCategory = item => {
            const fmt = item.format || '';
            if (fmt.includes('audio')) return 'Audio';
            if (fmt.includes('video')) return 'Video';
            if (fmt.includes('data') || fmt.includes('mux')) return 'Anc';
            // Se non c'è formato, proviamo a guardare la label come ultima spiaggia
            const label = (item.label || '').toLowerCase();
            if (label.includes('aud')) return 'Audio';
            if (label.includes('vid')) return 'Video';
            if (label.includes('anc') || label.includes('data')) return 'Anc';
            return 'Video'; // Default
        };

        // NORMALIZZIAMO TUTTO: Senders, Receivers, Devices e Nodes
        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);
        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);
        const allDevices = normalize(data?.devices);
        const allNodes = normalize(data?.nodes);

        return {
            filteredSenders: allSenders.filter(s => activeFilters[s.cat]),
            filteredReceivers: allReceivers.filter(r => activeFilters[r.cat]),
            devices: allDevices,
            nodes: allNodes,
            allReceivers,
        };
    }, [data, activeFilters]);

    // --- Sincronizzazione WebSocket (Invariata) ---
    useEffect(() => {
        if (processed.allReceivers.length > 0) {
            const initialMap = {};
            processed.allReceivers.forEach(recv => {
                if (recv.subscription?.sender_id)
                    initialMap[recv.id] = recv.subscription.sender_id;
            });
            setConnections(initialMap);
        }
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

    const styles = {
        container: {
            backgroundColor: theme.background,
            color: theme.text,
            padding: '20px',
            minHeight: '100vh',
        },
        header: {
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        button: active => ({
            padding: '8px 16px',
            cursor: 'pointer',
            border: `1px solid ${theme.primary}`,
            backgroundColor: active ? theme.primary : 'transparent',
            color: active ? '#000' : theme.text,
            borderRadius: '4px',
            fontWeight: 'bold',
        }),
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    FILTRI NMOS:
                </span>
                {['Video', 'Audio', 'Anc'].map(cat => (
                    <button
                        key={cat}
                        style={styles.button(activeFilters[cat])}
                        onClick={() => toggleFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div style={{ overflow: 'auto' }}>
                {/* PASSAGGIO CRUCIALE: 
                  Dobbiamo passare devices e nodes a MatrixBase affinché possa 
                  risolvere i nomi dei dispositivi dai device_id dei nodi.
                */}
                <MatrixBase
                    senders={processed.filteredSenders}
                    receivers={processed.filteredReceivers}
                    devices={processed.devices}
                    nodes={processed.nodes}
                    connections={connections}
                    onConnect={() => {}}
                />
            </div>
        </div>
    );
};

export default MatrixVideo;
