import React, { useContext, useEffect, useMemo, useState } from 'react';
import MatrixBase from './MatrixBase';
import { ThemeContext } from '../../theme/ThemeContext';

const MatrixVideo = ({ data }) => {
    const { theme } = useContext(ThemeContext);

    // Stato per i filtri di categoria (Video, Audio, Anc)
    const [activeFilters, setActiveFilters] = useState({
        Video: true,
        Audio: true,
        Anc: true,
    });

    // Stato per gestire quali Device sono "collassati" (nascosti)
    const [collapsedDevices, setCollapsedDevices] = useState([]);

    const [connections, setConnections] = useState({});

    // Funzione per mostrare/nascondere un dispositivo
    const toggleDeviceCollapse = deviceId => {
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
        const normalize = items => {
            if (!items) return [];
            return Array.isArray(items) ? items : Object.values(items);
        };

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

        const allSenders = normalize(data?.senders)
            .map(s => ({ ...s, cat: getCategory(s) }))
            .sort(sortAlpha);
        const allReceivers = normalize(data?.receivers)
            .map(r => ({ ...r, cat: getCategory(r) }))
            .sort(sortAlpha);
        const allDevices = normalize(data?.devices);
        const allNodes = normalize(data?.nodes);

        // FILTRAGGIO FINALE: Escludiamo i nodi il cui device_id è nella lista "collapsedDevices"
        const filteredSenders = allSenders
            .filter(s => activeFilters[s.cat])
            .filter(s => !collapsedDevices.includes(s.device_id));

        const filteredReceivers = allReceivers
            .filter(r => activeFilters[r.cat])
            .filter(r => !collapsedDevices.includes(r.device_id));

        return {
            filteredSenders,
            filteredReceivers,
            devices: allDevices,
            nodes: allNodes,
            allReceivers,
        };
    }, [data, activeFilters, collapsedDevices]);

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
        filterBar: {
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
        },
        button: active => ({
            padding: '6px 14px',
            cursor: 'pointer',
            border: `1px solid ${theme.primary}`,
            backgroundColor: active ? theme.primary : 'transparent',
            color: active ? theme.buttonText || '#000' : theme.text,
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '12px',
        }),
        resetBtn: {
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            backgroundColor: '#cc0000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.filterBar}>
                <span
                    style={{
                        fontWeight: 'bold',
                        fontSize: '12px',
                        color: theme.primary,
                    }}
                >
                    FILTRI CATEGORIA:
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

                {collapsedDevices.length > 0 && (
                    <button
                        style={styles.resetBtn}
                        onClick={() => setCollapsedDevices([])}
                    >
                        RIPRISTINA {collapsedDevices.length} NODI NASCOSTI
                    </button>
                )}
            </div>

            <div
                style={{
                    overflow: 'auto',
                    border: `1px solid ${theme.border}`,
                }}
            >
                {/* Passiamo una funzione fittizia onDeviceClick se MatrixBase la supporta, 
                   altrimenti il filtraggio avviene già a livello di array 'filteredSenders/Receivers'
                */}
                <MatrixBase
                    senders={processed.filteredSenders}
                    receivers={processed.filteredReceivers}
                    devices={processed.devices}
                    nodes={processed.nodes}
                    connections={connections}
                    onConnect={() => {}}
                    // Se MatrixBase supporta il click sull'intestazione del nodo:
                    onNodeClick={nodeId => toggleDeviceCollapse(nodeId)}
                />
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.6 }}>
                Suggerimento: I nodi vengono filtrati dinamicamente. Se un
                dispositivo non appare, controlla i filtri attivi.
            </div>
        </div>
    );
};

export default MatrixVideo;
