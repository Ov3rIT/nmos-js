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

    // Helper per capire se un elemento è l'ultimo del suo gruppo (per i bordi)
    const isLastInGroup = (currentIdx, array, key) => {
        if (currentIdx === array.length - 1) return false;
        return array[currentIdx][key] !== array[currentIdx + 1][key];
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
                                        '2px solid rgba(255,255,255,0.3)',
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
                                backgroundColor: lightBg,
                                color: primaryColor,
                                fontWeight: 'bold',
                            }}
                        >
                            Destinazioni
                        </TableCell>
                        {senders.map((sender, idx) => (
                            <TableCell
                                key={sender.id}
                                align="center"
                                style={{
                                    backgroundColor: lightBg,
                                    color: '#555',
                                    padding: '10px 5px',
                                    // Bordo verticale di divisione tra NODI
                                    borderRight: isLastInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `2px solid ${primaryColor}66`
                                        : '1px solid #eee',
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
                    {receivers.map((receiver, rIdx) => {
                        const group = receiverGroups[receiver.device_id];
                        const isFirstInGroup = group.firstId === receiver.id;
                        const isLastNodeRow = isLastInGroup(
                            rIdx,
                            receivers,
                            'device_id'
                        );

                        return (
                            <TableRow
                                key={receiver.id}
                                hover
                                style={{ backgroundColor: '#f9f9f9' }}
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
                                            borderBottom: `2px solid rgba(255,255,255,0.2)`,
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

                                <TableCell
                                    style={{
                                        backgroundColor: '#ececec',
                                        borderRight: `2px solid ${primaryColor}44`,
                                        // Bordo orizzontale di divisione tra NODI
                                        borderBottom: isLastNodeRow
                                            ? `2px solid ${primaryColor}66`
                                            : '1px solid #ddd',
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

                                {senders.map((sender, sIdx) => {
                                    const isConnected =
                                        connections[receiver.id] === sender.id;
                                    const isLastNodeCol = isLastInGroup(
                                        sIdx,
                                        senders,
                                        'device_id'
                                    );

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
                                                    ? `${primaryColor}22`
                                                    : 'transparent',
                                                color: isConnected
                                                    ? primaryColor
                                                    : '#ccc',
                                                fontSize: '1.1rem',
                                                // LOGICA BORDI DIFFERENZIATI
                                                borderRight: isLastNodeCol
                                                    ? `2px solid ${primaryColor}44`
                                                    : '1px solid #eee',
                                                borderBottom: isLastNodeRow
                                                    ? `2px solid ${primaryColor}44`
                                                    : '1px solid #eee',
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
