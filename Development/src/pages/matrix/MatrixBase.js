import React from 'react';
import { Table } from '@material-ui/core'; // Assumendo l'uso di semantic-ui come nel repo originale

const MatrixBase = ({
    senders,
    receivers,
    devices,
    nodes,
    connections,
    onConnect,
    onNodeClick,
}) => {
    // Funzione helper per trovare il nome del Device partendo dal device_id
    const getDeviceLabel = deviceId => {
        const dev = devices.find(d => d.id === deviceId);
        return dev ? dev.label : 'Unknown Device';
    };

    return (
        <div className="matrix-base" style={{ padding: '10px' }}>
            <Table celled structured unstackable inverted size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell style={{ minWidth: '150px' }}>
                            Receivers \ Senders
                        </Table.HeaderCell>
                        {senders.map(sender => (
                            <Table.HeaderCell
                                key={sender.id}
                                className="rotate-text"
                                onClick={() => onNodeClick(sender.device_id)} // CLICK SUL SENDER DEVICE
                                style={{
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                }}
                                title={`Dispositivo: ${getDeviceLabel(sender.device_id)}. Clicca per nascondere.`}
                            >
                                <div
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        padding: '5px',
                                    }}
                                >
                                    <strong>
                                        {getDeviceLabel(sender.device_id)}
                                    </strong>
                                    <br />
                                    <small>{sender.label}</small>
                                </div>
                            </Table.HeaderCell>
                        ))}
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {receivers.map(receiver => (
                        <Table.Row key={receiver.id}>
                            <Table.Cell
                                onClick={() => onNodeClick(receiver.device_id)} // CLICK SUL RECEIVER DEVICE
                                style={{
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                                title="Clicca per nascondere questo dispositivo"
                            >
                                <div>{getDeviceLabel(receiver.device_id)}</div>
                                <div
                                    style={{ fontSize: '0.85em', opacity: 0.7 }}
                                >
                                    {receiver.label}
                                </div>
                            </Table.Cell>

                            {senders.map(sender => {
                                const isConnected =
                                    connections[receiver.id] === sender.id;
                                return (
                                    <Table.Cell
                                        key={`${receiver.id}-${sender.id}`}
                                        textAlign="center"
                                        onClick={() =>
                                            onConnect(
                                                receiver,
                                                sender,
                                                !isConnected
                                            )
                                        }
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isConnected
                                                ? '#27ae60'
                                                : 'transparent',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        {isConnected ? '●' : '○'}
                                    </Table.Cell>
                                );
                            })}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            <style>{`
                .rotate-text { height: 140px; white-space: nowrap; }
                .matrix-base td:hover { background-color: rgba(255,255,255,0.1) !important; }
            `}</style>
        </div>
    );
};

export default MatrixBase;
