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
    darkBg,
    nodeBg,
}) => {
    const getDeviceLabel = deviceId => {
        const dev = devices?.find(d => d.id === deviceId);
        return dev ? dev.label : 'Unknown Device';
    };

    const senderGroups = senders.reduce((acc, s) => {
        const devId = s.device_id;
        if (!acc[devId])
            acc[devId] = { label: getDeviceLabel(devId), count: 0 };
        acc[devId].count++;
        return acc;
    }, {});

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
            style={{ backgroundColor: darkBg, boxShadow: 'none' }}
        >
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell
                            style={{
                                backgroundColor: '#121212',
                                borderBottom: `1px solid ${primaryColor}`,
                                width: 40,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: '#121212',
                                borderBottom: `1px solid ${primaryColor}`,
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
                                        '1px solid rgba(255,255,255,0.1)',
                                    padding: '6px',
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
                                backgroundColor: '#121212',
                                color: '#fff',
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
                                    backgroundColor: '#121212',
                                    color: '#aaa',
                                    padding: '10px 5px',
                                    borderBottom: `1px solid ${primaryColor}44`,
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
                    {receivers.map(receiver => {
                        const group = receiverGroups[receiver.device_id];
                        const isFirstInGroup = group.firstId === receiver.id;

                        return (
                            <TableRow
                                key={receiver.id}
                                style={{ backgroundColor: darkBg }}
                            >
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
                                                '1px solid rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                writingMode: 'vertical-rl',
                                                transform: 'rotate(180deg)',
                                                fontSize: '0.75rem',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {group.label}
                                        </div>
                                    </TableCell>
                                )}

                                <TableCell
                                    style={{
                                        backgroundColor: nodeBg,
                                        borderRight: `1px solid rgba(255,255,255,0.05)`,
                                        borderBottom: `1px solid rgba(255,255,255,0.05)`,
                                        padding: '8px',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        style={{
                                            color: '#fff',
                                            fontWeight: 500,
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
                                                    ? `${primaryColor}33`
                                                    : 'transparent',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                color: isConnected
                                                    ? primaryColor
                                                    : '#444',
                                                fontSize: '1.1rem',
                                                transition: 'all 0.1s',
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
