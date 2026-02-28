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

    const senderGroups = senders.reduce((acc, s) => {
        const devId = s.device_id;
        if (!acc[devId])
            acc[devId] = { label: getDeviceLabel(devId), count: 0 };
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
                                }}
                            >
                                {group.label}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        <TableCell
                            style={{
                                minWidth: 200,
                                backgroundColor: lightBg,
                                color: primaryColor,
                                fontWeight: 'bold',
                            }}
                        >
                            Destinazioni \ Sorgenti
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
                    {receivers.map(receiver => (
                        <TableRow key={receiver.id} hover>
                            <TableCell
                                style={{
                                    backgroundColor: '#fff',
                                    borderRight: `1px solid ${primaryColor}22`,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    display="block"
                                    style={{
                                        color: primaryColor,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {getDeviceLabel(receiver.device_id)}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    style={{ color: '#333', fontWeight: 500 }}
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
                                            border: '1px solid #f0f0f0',
                                            color: isConnected
                                                ? primaryColor
                                                : '#ccc',
                                            fontSize: '1.1rem',
                                            transition: 'all 0.2s',
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
