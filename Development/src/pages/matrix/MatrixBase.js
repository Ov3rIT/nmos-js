import React from 'react';

const MatrixBase = ({
    devices = [],
    senders = [],
    receivers = [],
    connections = {},
    onConnect,
}) => {
    // Fallback: se non ci sono canali, mostriamo un messaggio
    if (senders.length === 0 && receivers.length === 0) {
        return (
            <div style={{ color: '#666', padding: '20px' }}>
                No streams found for this category.
            </div>
        );
    }

    // Funzione migliorata per raggruppare: se il device non esiste, usiamo un placeholder
    const getGrouped = items => {
        const groups = {};
        items.forEach(item => {
            const dId = item.device_id || 'unknown';
            if (!groups[dId]) {
                const dev = devices.find(d => d.id === dId);
                groups[dId] = {
                    label: dev
                        ? dev.label
                        : item.device_id
                          ? `Device ${item.device_id.slice(0, 8)}`
                          : 'Unknown Device',
                    channels: [],
                };
            }
            groups[dId].channels.push(item);
        });
        return Object.values(groups);
    };

    const groupedSenders = getGrouped(senders);
    const groupedReceivers = getGrouped(receivers);

    return (
        <div className="dante-matrix-wrapper">
            <table className="dante-table">
                <thead>
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
                            <tr className="device-row-header">
                                <td
                                    colSpan={
                                        groupedSenders.flatMap(g => g.channels)
                                            .length + 1
                                    }
                                >
                                    {gr.label}
                                </td>
                            </tr>
                            {gr.channels.map(r => (
                                <tr key={r.id}>
                                    <td className="h-header-channel">
                                        {r.label || r.id.slice(0, 8)}
                                    </td>
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
