import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext'; // Importiamo il contesto del tema

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext); // Recuperiamo il tema globale

    // Stato dei filtri: ora è un oggetto che permette selezioni multiple
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: false,
        Anc: false,
    });

    const [connections, setConnections] = useState({});

    // Funzione per attivare/disattivare i singoli filtri
    const toggleFilter = label => {
        setActiveFilters(prev => ({
            ...prev,
            [label]: !prev[label],
        }));
    };

    // --- 1. LOGICA DI ELABORAZIONE DATI CON FILTRI MULTIPLI ---
    const processed = useMemo(() => {
        const normalize = items =>
            Array.isArray(items) ? items : Object.values(items || {});
        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        const getCategory = item => {
            switch (item.format) {
                case 'urn:x-nmos:format:video':
                    return 'Video';
                case 'urn:x-nmos:format:audio':
                    return 'Audio';
                case 'urn:x-nmos:format:data':
                    return 'Anc';
                default:
                    return 'Altro';
            }
        };

        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);

        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);

        // Filtriamo i nodi: un nodo è visibile se la sua categoria è TRUE in activeFilters
        return {
            filteredSenders: allSenders.filter(s => activeFilters[s.cat]),
            filteredReceivers: allReceivers.filter(r => activeFilters[r.cat]),
            allReceivers,
        };
    }, [data, activeFilters]);

    // --- 2. SINCRONIZZAZIONE INIZIALE E WEBSOCKET (Invariati) ---
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

    const handleToggleConnection = (r, s, state) =>
        console.log('PATCH disabilitato', r.id, s.id);

    // --- STILI DINAMICI BASATI SUL TEMA ---
    const dynamicStyles = {
        container: {
            backgroundColor: theme.background, // Colore sfondo dal tema
            color: theme.text,
            minHeight: '100vh',
            padding: '20px',
        },
        filterButton: isActive => ({
            padding: '8px 16px',
            marginRight: '10px',
            border: `1px solid ${theme.primary}`,
            backgroundColor: isActive ? theme.primary : 'transparent',
            color: isActive ? theme.buttonText : theme.text,
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
        }),
        header: {
            borderBottom: `1px solid ${theme.border}`,
            marginBottom: '20px',
            paddingBottom: '10px',
        },
    };

    return (
        <div style={dynamicStyles.container}>
            <header style={dynamicStyles.header}>
                <h3 style={{ color: theme.primary }}>
                    Visualizzazione Dinamica Crosspoint
                </h3>
                <div style={{ marginTop: '15px' }}>
                    <span style={{ marginRight: '15px', fontSize: '0.9rem' }}>
                        Filtri attivi:
                    </span>
                    {['Video', 'Audio', 'Anc'].map(label => (
                        <button
                            key={label}
                            onClick={() => toggleFilter(label)}
                            style={dynamicStyles.filterButton(
                                activeFilters[label]
                            )}
                        >
                            {label} {activeFilters[label] ? '✓' : ''}
                        </button>
                    ))}
                </div>
            </header>

            <div className="matrix-content">
                {processed.filteredReceivers.length > 0 ? (
                    <MatrixBase
                        senders={processed.filteredSenders}
                        receivers={processed.filteredReceivers}
                        connections={connections}
                        onConnect={handleToggleConnection}
                        theme={theme} // Passiamo il tema anche alla base se necessario
                    />
                ) : (
                    <div
                        style={{
                            padding: '50px',
                            textAlign: 'center',
                            opacity: 0.5,
                        }}
                    >
                        Seleziona almeno un filtro per visualizzare la matrice.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatrixVideo;
