import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@material-ui/core';

const MatrixBase = ({
    senders,
    receivers,
    devices,
    connections,
    onConnect,
    onNodeClick,
}) => {
    // Funzione per risolvere il nome del device
    const getDeviceLabel = deviceId => {
        if (!devices) return 'Unknown';
        const dev = devices.find(d => d.id === deviceId);
        return dev ? dev.label : 'Unknown Device';
    };

    return (
        <TableContainer
            component={Paper}
            style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
        >
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell
                            style={{
                                minWidth: 200,
                                backgroundColor: '#1a1a1a',
                                color: '#fff',
                            }}
                        >
                            Receivers \ Senders
                        </TableCell>
                        {senders.map(sender => (
                            <TableCell
                                key={sender.id}
                                align="center"
                                onClick={() =>
                                    onNodeClick && onNodeClick(sender.device_id)
                                }
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: '#fff',
                                    color: '#1a1a1a',
                                    padding: '10px 5px',
                                }}
                            >
                                <div
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <strong>
                                        {getDeviceLabel(sender.device_id)}
                                    </strong>
                                    <div style={{ opacity: 0.7, marginTop: 4 }}>
                                        {sender.label}
                                    </div>
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {receivers.map(receiver => (
                        <TableRow key={receiver.id}>
                            <TableCell
                                onClick={() =>
                                    onNodeClick &&
                                    onNodeClick(receiver.device_id)
                                }
                                style={{
                                    cursor: 'pointer',
                                    color: '#fff',
                                    borderRight:
                                        '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: '#1a1a1a',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    display="block"
                                    style={{
                                        fontWeight: 'bold',
                                        color: '#fff',
                                    }}
                                >
                                    {getDeviceLabel(receiver.device_id)}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    style={{ opacity: 0.6, color: '#fff' }}
                                >
                                    {receiver.label}
                                </Typography>
                            </TableCell>

                            {senders.map(sender => {
                                const isConnected =
                                    connections[receiver.id] === sender.id;
                                return (
                                    <TableCell
                                        key={`${receiver.id}-${sender.id}`}
                                        align="center"
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
                                                ? 'rgba(39, 174, 96, 0.3)'
                                                : 'transparent',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            color: isConnected
                                                ? '#2ecc71'
                                                : '#444',
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        {isConnected ? '●' : '○'}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default MatrixBase;
