import React from 'react';

const MatrixBase = ({
    devices = [],
    senders = [],
    receivers = [],
    connections = {},
    onConnect,
}) => {
    // Funzione interna per raggruppare i canali sotto il nome del dispositivo (Node/Device)
    const getGrouped = items => {
        const groups = {};
        items.forEach(item => {
            const dId = item.device_id;
            const dev = devices.find(d => d.id === dId);
            const groupKey = dId || 'unknown';

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    label: dev
                        ? dev.label || dev.description
                        : 'Altri Dispositivi',
                    channels: [],
                };
            }
            groups[groupKey].channels.push(item);
        });
        return Object.values(groups);
    };

    const groupedSenders = getGrouped(senders);
    const groupedReceivers = getGrouped(receivers);

    // Conta quanti sender ci sono in totale per impostare la larghezza delle righe header
    const totalSenderCount = senders.length;

    // Helper per determinare il tipo di flusso (per i colori dei quadratini)
    const getFlowType = item => {
        const format = (item?.format || '').toLowerCase();
        if (format.includes('video')) return 'video';
        if (format.includes('audio')) return 'audio';
        return 'ancillary';
    };

    return (
        <div className="dante-matrix-wrapper">
            <table className="dante-table">
                <thead>
                    {/* RIGA 1: Nomi dei Dispositivi Sender (Colonne) */}
                    <tr>
                        <th className="corner-label" rowSpan="2">
                            RECEIVERS \ SENDERS
                        </th>
                        {groupedSenders.map((g, i) => (
                            <th
                                key={i}
                                colSpan={g.channels.length}
                                className="device-header-v"
                            >
                                {g.label}
                            </th>
                        ))}
                    </tr>
                    {/* RIGA 2: Nomi dei singoli flussi Sender (Verticali) */}
                    <tr>
                        {groupedSenders
                            .flatMap(g => g.channels)
                            .map(s => (
                                <th
                                    key={s.id}
                                    className="v-header"
                                    title={s.label}
                                >
                                    <div className="v-text">
                                        {s.label || s.id.slice(0, 8)}
                                    </div>
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody>
                    {groupedReceivers.map((gr, i) => (
                        <React.Fragment key={i}>
                            {/* Header del Dispositivo Receiver (Riga orizzontale) */}
                            <tr className="device-row-header">
                                <td colSpan={totalSenderCount + 1}>
                                    {gr.label}
                                </td>
                            </tr>
                            {/* Righe dei flussi Receiver */}
                            {gr.channels.map(r => (
                                <tr key={r.id}>
                                    <td
                                        className="h-header-channel"
                                        title={r.label}
                                    >
                                        {r.label || r.id.slice(0, 8)}
                                    </td>
                                    {/* Celle di incrocio per il Patch */}
                                    {groupedSenders
                                        .flatMap(g => g.channels)
                                        .map(s => {
                                            const isConnected =
                                                connections[r.id] === s.id;
                                            const flowType = getFlowType(s);

                                            return (
                                                <td
                                                    key={`${r.id}-${s.id}`}
                                                    className={`matrix-cell ${isConnected ? 'active' : ''}`}
                                                    onClick={() =>
                                                        onConnect(
                                                            r,
                                                            s,
                                                            isConnected
                                                        )
                                                    }
                                                    title={`${s.label} -> ${r.label}`}
                                                >
                                                    {isConnected && (
                                                        <div
                                                            className={`dante-check status-${flowType}`}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatrixBase;
