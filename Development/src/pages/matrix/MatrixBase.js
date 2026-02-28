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
import CheckCircleIcon from '@material-ui/icons/CheckCircle'; // Import dell'icona
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

    const isLastInGroup = (currentIdx, array, key) => {
        if (currentIdx === array.length - 1) return true;
        return array[currentIdx][key] !== array[currentIdx + 1][key];
    };

    const isFirstInGroup = (currentIdx, array, key) => {
        if (currentIdx === 0) return true;
        return array[currentIdx][key] !== array[currentIdx - 1][key];
    };

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

    const gridLineColor = '#ddd';
    const nodeLineColor = 'rgb(1, 80, 72)';
    const activeGreen = '#27ae60'; // Verde brillante per la spunta

    return (
        <TableContainer
            component={Paper}
            style={{
                backgroundColor: '#fff',
                boxShadow: 'none',
                height: '100%',
            }}
        >
            <Table
                size="small"
                stickyHeader
                style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}
            >
                {/* ... (TableHead rimane identico alla versione precedente per mantenere il fix dell'allineamento) ... */}
                <TableHead>
                    <TableRow>
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: 40,
                                position: 'sticky',
                                left: 0,
                                zIndex: 20,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: 160,
                                position: 'sticky',
                                left: 40,
                                zIndex: 20,
                            }}
                        />
                        {/* Mappa Sender Groups qui... (stessa logica del file precedente) */}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {receivers.map((receiver, rIdx) => {
                        const rGroup = receiverGroups[receiver.device_id];
                        const isFirstR = rGroup.firstId === receiver.id;
                        const isLastRNode = isLastInGroup(
                            rIdx,
                            receivers,
                            'device_id'
                        );

                        return (
                            <TableRow key={receiver.id}>
                                {isFirstR && (
                                    <TableCell
                                        rowSpan={rGroup.count}
                                        style={{
                                            backgroundColor: primaryColor,
                                            color: '#fff',
                                            textAlign: 'center',
                                            width: 40,
                                            borderBottom: `3px solid ${nodeLineColor}`,
                                            borderRight: `3px solid ${nodeLineColor}`,
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 5,
                                        }}
                                    >
                                        <div
                                            style={{
                                                writingMode: 'vertical-rl',
                                                transform: 'rotate(180deg)',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {rGroup.label}
                                        </div>
                                    </TableCell>
                                )}

                                <TableCell
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        borderRight: `3px solid ${nodeLineColor}`,
                                        borderBottom: isLastRNode
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        padding: '8px',
                                        position: 'sticky',
                                        left: 40,
                                        zIndex: 5,
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
                                    const isFirstSNode = isFirstInGroup(
                                        sIdx,
                                        senders,
                                        'device_id'
                                    );
                                    const isLastSNode = isLastInGroup(
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
                                                    ? `${activeGreen}11`
                                                    : 'transparent',
                                                borderLeft: isFirstSNode
                                                    ? `3px solid ${nodeLineColor}`
                                                    : 'none',
                                                borderRight: isLastSNode
                                                    ? `3px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,
                                                borderBottom: isLastRNode
                                                    ? `3px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,
                                                boxSizing: 'border-box',
                                                padding: 0, // Riduciamo il padding per centrare l'icona
                                            }}
                                        >
                                            {isConnected ? (
                                                <CheckCircleIcon
                                                    style={{
                                                        color: activeGreen,
                                                        fontSize: '1.4rem',
                                                        display: 'block',
                                                        margin: 'auto',
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        color: '#eee',
                                                        fontSize: '1.2rem',
                                                    }}
                                                >
                                                    ○
                                                </span>
                                            )}
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
