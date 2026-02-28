import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext'; // Importiamo il contesto del tema

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);

    // Stato filtri: Video attivo di default
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: false,
        Anc: false,
    });

    const [connections, setConnections] = useState({});

    const toggleFilter = label => {
        setActiveFilters(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const processed = useMemo(() => {
        // Funzione helper per trasformare oggetti in array
        const normalize = items => {
            if (!items) return [];
            return Array.isArray(items) ? items : Object.values(items);
        };

        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        const getCategory = item => {
            const fmt = item.format || '';
            if (fmt.includes(':video')) return 'Video';
            if (fmt.includes(':audio')) return 'Audio';
            if (fmt.includes(':data')) return 'Anc';
            return 'Altro';
        };

        // Estraiamo e categorizziamo
        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);
        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);

        // Filtriamo in base ai toggle
        const filteredSenders = allSenders.filter(s => activeFilters[s.cat]);
        const filteredReceivers = allReceivers.filter(
            r => activeFilters[r.cat]
        );

        // DEBUG LOG: Controlla la console del browser per vedere questi numeri
        console.log(`Filtri:`, activeFilters);
        console.log(
            `Sender trovati: ${filteredSenders.length}`,
            filteredSenders
        );
        console.log(
            `Receiver trovati: ${filteredReceivers.length}`,
            filteredReceivers
        );

        return {
            filteredSenders,
            filteredReceivers,
            allReceivers: allReceivers,
        };
    }, [data, activeFilters]);

    // WebSocket e Sincronizzazione (Invariati)
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

    const dynamicStyles = {
        container: {
            backgroundColor: theme.background || '#121212',
            color: theme.text || '#ffffff',
            padding: '20px',
            minHeight: '100vh',
        },
        button: active => ({
            padding: '8px 16px',
            marginRight: '10px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: `1px solid ${theme.primary}`,
            backgroundColor: active ? theme.primary : 'transparent',
            color: active ? theme.buttonText || '#000' : theme.text || '#fff',
            fontWeight: 'bold',
        }),
    };

    return (
        <div style={dynamicStyles.container}>
            <div style={{ marginBottom: '20px' }}>
                {['Video', 'Audio', 'Anc'].map(cat => (
                    <button
                        key={cat}
                        style={dynamicStyles.button(activeFilters[cat])}
                        onClick={() => toggleFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Assicurati che MatrixBase riceva entrambi gli array filtrati */}
            <div style={{ overflowX: 'auto' }}>
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
