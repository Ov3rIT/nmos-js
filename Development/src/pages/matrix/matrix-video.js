import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext'; // Importiamo il contesto del tema

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);

    // Partiamo con tutti i filtri attivi per vedere tutto
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

        // LOGICA DI CATEGORIZZAZIONE POTENZIATA
        const getCategory = item => {
            const fmt = item.format || '';
            // Debug: se è un sender, vediamo cosa legge
            if (fmt.includes('audio')) return 'Audio';
            if (fmt.includes('video')) return 'Video';
            if (fmt.includes('data') || fmt.includes('mux')) return 'Anc';

            // FALLBACK: Se non capisce il formato, lo assegniamo a Video
            // per evitare che il sender scompaia nel nulla
            return 'Video';
        };

        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);
        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);

        return {
            filteredSenders: allSenders.filter(s => activeFilters[s.cat]),
            filteredReceivers: allReceivers.filter(r => activeFilters[r.cat]),
            allReceivers,
        };
    }, [data, activeFilters]);

    // WebSocket e Sync Iniziale (Invariati)
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
            display: 'flex',
            flexDirection: 'column',
        },
        header: { marginBottom: '20px' },
        button: active => ({
            padding: '10px 20px',
            marginRight: '10px',
            cursor: 'pointer',
            border: `2px solid ${theme.primary}`,
            backgroundColor: active ? theme.primary : 'transparent',
            color: active ? '#ffffff' : theme.text,
            borderRadius: '4px',
            fontWeight: 'bold',
        }),
        matrixWrapper: {
            flex: 1,
            overflow: 'auto', // Fondamentale per vedere i Sender se sono molti
            border: `1px solid ${theme.border || '#333'}`,
            borderRadius: '8px',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                {['Video', 'Audio', 'Anc'].map(cat => (
                    <button
                        key={cat}
                        style={styles.button(activeFilters[cat])}
                        onClick={() => toggleFilter(cat)}
                    >
                        {cat} {activeFilters[cat] ? 'ON' : 'OFF'}
                    </button>
                ))}
            </div>

            <div style={styles.matrixWrapper}>
                {/* IMPORTANTE: Se MatrixBase non riceve i sender, 
                    potrebbe dipendere dal fatto che 'processed.filteredSenders' è 0.
                */}
                <MatrixBase
                    senders={processed.filteredSenders}
                    receivers={processed.filteredReceivers}
                    connections={connections}
                    onConnect={() => {}}
                />
            </div>
        </div>
    );
};

export default MatrixVideo;
