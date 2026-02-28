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
import React from 'react';

const MatrixBase = ({
    senders,
    receivers,
    devices,
    connections,
    onConnect,
    primaryColor,
    lightBg,
}) => {
    const getDeviceLabel = deviceId => {
        const dev = devices?.find(d => d.id === deviceId);
        return dev ? dev.label : 'Unknown Device';
    };

    // Raggruppamento SENDER (Header)
    const senderGroups = senders.reduce((acc, s) => {
        const devId = s.device_id;
        if (!acc[devId])
            acc[devId] = { label: getDeviceLabel(devId), count: 0 };
        acc[devId].count++;
        return acc;
    }, {});

    // Raggruppamento RECEIVER (Rows)
    const receiverGroups = receivers.reduce((acc, r) => {
        const devId = r.device_id;
        if (!acc[devId])
            acc[devId] = {
                label: getDeviceLabel(devId),
                count: 0,
                firstId: r.id,
            };
        acc[devId].count++;
        return acc;
    }, {});

    return (
        <TableContainer
            component={Paper}
            style={{ backgroundColor: '#fff', boxShadow: 'none' }}
        >
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `2px solid ${primaryColor}`,
                                width: 40,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `2px solid ${primaryColor}`,
                                minWidth: 160,
                            }}
                        />
                        {Object.values(senderGroups).map((group, idx) => (
                            <TableCell
                                key={idx}
                                align="center"
                                colSpan={group.count}
                                style={{
                                    backgroundColor: primaryColor,
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    borderLeft:
                                        '1px solid rgba(255,255,255,0.2)',
                                    padding: '4px',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {group.label}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        <TableCell
                            colSpan={2}
                            style={{
                                backgroundColor: lightBg,
                                color: primaryColor,
                                fontWeight: 'bold',
                            }}
                        >
                            Destinazioni
                        </TableCell>
                        {senders.map(sender => (
                            <TableCell
                                key={sender.id}
                                align="center"
                                style={{
                                    backgroundColor: lightBg,
                                    color: '#555',
                                    padding: '10px 5px',
                                }}
                            >
                                <div
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {sender.label}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {receivers.map((receiver, index) => {
                        const group = receiverGroups[receiver.device_id];
                        const isFirstInGroup = group.firstId === receiver.id;

                        return (
                            <TableRow key={receiver.id} hover>
                                {/* Cella Device (Verticale) */}
                                {isFirstInGroup && (
                                    <TableCell
                                        rowSpan={group.count}
                                        style={{
                                            backgroundColor: primaryColor,
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            padding: '8px 4px',
                                            width: 40,
                                            borderBottom:
                                                '1px solid rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                writingMode: 'vertical-rl',
                                                transform: 'rotate(180deg)',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            {group.label}
                                        </div>
                                    </TableCell>
                                )}

                                {/* Cella Canale Receiver */}
                                <TableCell
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRight: `1px solid ${primaryColor}22`,
                                        padding: '8px',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        style={{
                                            color: '#333',
                                            fontWeight: 600,
                                        }}
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
                                                    ? `${primaryColor}15`
                                                    : 'transparent',
                                                border: '1px solid #f8f8f8',
                                                color: isConnected
                                                    ? primaryColor
                                                    : '#ddd',
                                                fontSize: '1.1rem',
                                            }}
                                        >
                                            {isConnected ? '●' : '○'}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default MatrixBase;
