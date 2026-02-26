import React from 'react';

const MatrixBase = ({
    devices = [],
    senders = [],
    receivers = [],
    connections = {},
    onConnect,
}) => {
    // Funzione di raggruppamento robusta
    const getGrouped = items => {
        const groups = {};

        items.forEach(item => {
            // Cerchiamo il dispositivo associato
            const dId = item.device_id;
            const dev = devices.find(d => d.id === dId);
            const groupKey = dId || 'unknown';

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    label: dev ? dev.label || dev.description : 'Other Sources',
                    channels: [],
                };
            }
            groups[groupKey].channels.push(item);
        });
        return Object.values(groups);
    };

    const groupedSenders = getGrouped(senders);
    const groupedReceivers = getGrouped(receivers);

    // Calcoliamo il numero totale di sender per il colspan delle righe receiver
    const totalSenderCount = senders.length;

    return (
        <div className="dante-matrix-wrapper">
            <table className="dante-table">
                <thead>
                    {/* PRIMA RIGA: Nomi dei Dispositivi Sender */}
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
                    {/* SECONDA RIGA: Nomi dei Canali Sender (Verticali) */}
                    <tr>
                        {groupedSenders
                            .flatMap(g => g.channels)
                            .map(s => (
                                <th key={s.id} className="v-header">
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
                            {/* Riga Intestazione Dispositivo Receiver */}
                            <tr className="device-row-header">
                                <td colSpan={totalSenderCount + 1}>
                                    {gr.label}
                                </td>
                            </tr>
                            {/* Righe dei Canali Receiver */}
                            {gr.channels.map(r => (
                                <tr key={r.id}>
                                    <td className="h-header-channel">
                                        {r.label || r.id.slice(0, 8)}
                                    </td>
                                    {/* Celle di incrocio */}
                                    {groupedSenders
                                        .flatMap(g => g.channels)
                                        .map(s => {
                                            const isConnected =
                                                connections[r.id] === s.id;
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
                                                >
                                                    {isConnected && (
                                                        <div className="dante-check" />
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
