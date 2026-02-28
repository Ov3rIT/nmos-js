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

    // Funzione per identificare il cambio di nodo
    const isLastInGroup = (currentIdx, array, key) => {
        if (currentIdx === array.length - 1) return true; // L'ultimo in assoluto chiude il bordo
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

    // Definizione colori bordi
    const gridLineColor = '#bbb'; // Grigio più scuro per la griglia standard
    const nodeLineColor = 'rgb(1, 80, 72)'; // Una tonalità più scura e intensa del tuo primario

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
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: 40,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
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
                                    borderLeft: `3px solid ${nodeLineColor}`,
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
                                borderBottom: `3px solid ${nodeLineColor}`,
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
                                    color: '#444',
                                    padding: '10px 5px',
                                    borderBottom: `3px solid ${nodeLineColor}`,
                                    borderRight: isLastInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `3px solid ${nodeLineColor}`
                                        : `1px solid ${gridLineColor}`,
                                }}
                            >
                                <div
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
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
                                style={{ backgroundColor: '#fdfdfd' }}
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
                                            borderBottom: `3px solid ${nodeLineColor}`,
                                            borderRight: `1px solid ${nodeLineColor}`,
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
                                        backgroundColor: '#f0f0f0',
                                        borderRight: `3px solid ${nodeLineColor}`,
                                        borderBottom: isLastNodeRow
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        padding: '8px',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        style={{
                                            color: '#000',
                                            fontWeight: 700,
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
                                                    : '#888',
                                                fontSize: '1.2rem',
                                                // Bordo orizzontale
                                                borderBottom: isLastNodeRow
                                                    ? `3px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,
                                                // Bordo verticale
                                                borderRight: isLastNodeCol
                                                    ? `3px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,
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
