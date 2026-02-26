import React from 'react';

const MatrixBase = ({
    devices,
    senders,
    receivers,
    connections,
    onConnect,
}) => {
    const groupedSenders = devices
        .map(dev => ({
            device: dev,
            channels: senders.filter(s => s.device_id === dev.id),
        }))
        .filter(g => g.channels.length > 0);

    const groupedReceivers = devices
        .map(dev => ({
            device: dev,
            channels: receivers.filter(r => r.device_id === dev.id),
        }))
        .filter(g => g.channels.length > 0);

    return (
        <div className="dante-matrix-wrapper">
            <table className="dante-table">
                <thead>
                    <tr>
                        <th className="corner-label" rowSpan="2">
                            RECEIVERS \ SENDERS
                        </th>
                        {groupedSenders.map(g => (
                            <th
                                key={g.device.id}
                                colSpan={g.channels.length}
                                className="device-header-v"
                            >
                                {g.device.label}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {groupedSenders
                            .flatMap(g => g.channels)
                            .map(s => (
                                <th key={s.id} className="v-header">
                                    <div className="v-text">{s.label}</div>
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody>
                    {groupedReceivers.map(gr => (
                        <React.Fragment key={gr.device.id}>
                            <tr className="device-row-header">
                                <td
                                    colSpan={
                                        groupedSenders.flatMap(g => g.channels)
                                            .length + 1
                                    }
                                >
                                    {gr.device.label}
                                </td>
                            </tr>
                            {gr.channels.map(r => (
                                <tr key={r.id}>
                                    <td className="h-header-channel">
                                        {r.label}
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

export default MatrixBase; // <--- FONDAMENTALE
