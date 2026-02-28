import React, { useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';

const MatrixVideo = ({ data }) => {
    // Stato per gestire quale "livello" NMOS visualizzare
    const [activeTab, setActiveTab] = useState('Video');
    // Stato per i cross-point in tempo reale (da WebSocket)
    const [connections, setConnections] = useState({});

    // --- 1. LOGICA DI ELABORAZIONE DATI ---
    const processed = useMemo(() => {
        const normalize = items =>
            Array.isArray(items) ? items : Object.values(items || {});

        // Funzione di ordinamento alfabetico per label
        const sortAlpha = (a, b) =>
            (a.label || '').localeCompare(b.label || '');

        // Mapping basato sul campo "format" dell'oggetto NMOS
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

        // Prepariamo tutti i nodi con la loro categoria
        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);

        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);

        // Filtriamo solo quelli corrispondenti al Tab selezionato
        return {
            filteredSenders: allSenders.filter(s => s.cat === activeTab),
            filteredReceivers: allReceivers.filter(r => r.cat === activeTab),
            allReceivers, // ci serve per l'inizializzazione dello stato
        };
    }, [data, activeTab]);

    // --- 2. SINCRONIZZAZIONE STATO INIZIALE ---
    useEffect(() => {
        if (processed.allReceivers.length > 0) {
            const initialMap = {};
            processed.allReceivers.forEach(recv => {
                if (recv.subscription?.sender_id) {
                    initialMap[recv.id] = recv.subscription.sender_id;
                }
            });
            setConnections(initialMap);
        }
    }, [processed.allReceivers]);

    // --- 3. GESTIONE WEBSOCKET (REAL-TIME) ---
    useEffect(() => {
        // Sostituisci con il tuo ID sottoscrizione reale
        const wsUrl =
            'ws://172.16.1.110:8011/x-nmos/query/v1.3/subscriptions/131230a2-c19d-47b3-98ae-e0a59013ea02';
        const ws = new WebSocket(wsUrl);

        ws.onmessage = event => {
            try {
                const grains = JSON.parse(event.data);
                if (Array.isArray(grains)) {
                    const updates = {};
                    grains.forEach(grain => {
                        // Se c'è una modifica (post), aggiorniamo il sender_id del receiver
                        if (grain.post) {
                            updates[grain.post.id] =
                                grain.post.subscription?.sender_id || null;
                        }
                    });
                    setConnections(prev => ({ ...prev, ...updates }));
                }
            } catch (err) {
                console.error('Errore parse WS:', err);
            }
        };

        return () => ws.close();
    }, []);

    // Placeholder per l'azione di click (patch momentaneamente disabilitato)
    const handleToggleConnection = (receiver, sender, isConnected) => {
        console.log(
            `Richiesta PATCH: Receiver ${receiver.label} -> Sender ${sender.label} (${isConnected ? 'Connect' : 'Disconnect'})`
        );
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>NMOS Matrix Control</h2>

                {/* NAVIGAZIONE FILTRI */}
                <div style={styles.tabBar}>
                    {['Video', 'Audio', 'Anc'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                ...styles.tabButton,
                                ...(activeTab === tab ? styles.tabActive : {}),
                            }}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            <div style={styles.matrixArea}>
                {processed.filteredReceivers.length > 0 ? (
                    <MatrixBase
                        senders={processed.filteredSenders}
                        receivers={processed.filteredReceivers}
                        connections={connections}
                        onConnect={handleToggleConnection}
                    />
                ) : (
                    <div style={styles.noData}>
                        Nessun nodo trovato per la categoria {activeTab}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STILI INLINE (per semplicità, puoi spostarli in CSS) ---
const styles = {
    container: {
        backgroundColor: '#121212',
        color: '#ffffff',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px',
    },
    title: { margin: 0, fontSize: '1.5rem', color: '#00d1b2' },
    tabBar: { display: 'flex', gap: '5px' },
    tabButton: {
        padding: '8px 16px',
        border: 'none',
        backgroundColor: '#2a2a2a',
        color: '#aaa',
        cursor: 'pointer',
        borderRadius: '4px',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
    tabActive: {
        backgroundColor: '#00d1b2',
        color: '#000',
    },
    matrixArea: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '10px',
        overflow: 'auto',
    },
    noData: {
        padding: '40px',
        textAlign: 'center',
        color: '#666',
    },
};

export default MatrixVideo;
