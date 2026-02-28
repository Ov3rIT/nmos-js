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
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
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
    // Dimensione fissa per rendere la griglia quadrata
    const cellSize = 45;

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

    const gridLineColor = '#ddd';
    const nodeLineColor = 'rgb(1, 80, 72)';
    const activeGreen = '#27ae60';

    return (
        <TableContainer
            component={Paper}
            style={{
                backgroundColor: '#fff',
                boxShadow: 'none',
                height: '100%',
                scrollbarWidth: 'thin',
                scrollbarColor: `${primaryColor} #f0f0f0`,
            }}
        >
            <Table
                size="small"
                stickyHeader
                style={{
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    width: 'max-content',
                }}
            >
                <TableHead>
                    {/* RIGA 1: GRUPPI NODI SENDER */}
                    <TableRow style={{ height: cellSize }}>
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: cellSize,
                                position: 'sticky',
                                left: 0,
                                zIndex: 30,
                                padding: 0,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: 160,
                                position: 'sticky',
                                left: cellSize,
                                zIndex: 30,
                                padding: 0,
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
                                    fontSize: '0.7rem',
                                    borderLeft: `3px solid ${nodeLineColor}`,
                                    borderBottom: `3px solid ${nodeLineColor}`,
                                    boxSizing: 'border-box',
                                    padding: '2px',
                                }}
                            >
                                {group.label}
                            </TableCell>
                        ))}
                    </TableRow>

                    {/* RIGA 2: LABEL SINGOLI SENDER */}
                    <TableRow style={{ height: 120 }}>
                        {' '}
                        {/* Altezza maggiore per ospitare i nomi verticali */}
                        <TableCell
                            colSpan={2}
                            style={{
                                backgroundColor: lightBg,
                                color: primaryColor,
                                fontWeight: 'bold',
                                borderBottom: `3px solid ${nodeLineColor}`,
                                borderRight: `3px solid ${nodeLineColor}`,
                                position: 'sticky',
                                left: 0,
                                top: cellSize,
                                zIndex: 25,
                                textAlign: 'center',
                            }}
                        >
                            Destinazioni
                        </TableCell>
                        {senders.map((sender, idx) => {
                            const firstOfNode = isFirstInGroup(
                                idx,
                                senders,
                                'device_id'
                            );
                            const lastOfNode = isLastInGroup(
                                idx,
                                senders,
                                'device_id'
                            );

                            return (
                                <TableCell
                                    key={sender.id}
                                    align="center"
                                    style={{
                                        backgroundColor: lightBg,
                                        borderBottom: `3px solid ${nodeLineColor}`,
                                        borderLeft: firstOfNode
                                            ? `3px solid ${nodeLineColor}`
                                            : 'none',
                                        borderRight: lastOfNode
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        padding: '5px 0',
                                        top: cellSize,
                                        zIndex: 10,
                                        width: cellSize,
                                        minWidth: cellSize,
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div
                                        style={{
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            margin: 'auto',
                                        }}
                                    >
                                        {sender.label}
                                    </div>
                                </TableCell>
                            );
                        })}
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
                            <TableRow
                                key={receiver.id}
                                style={{ height: cellSize }}
                            >
                                {/* NODO RECEIVER (VERTICALE) */}
                                {isFirstR && (
                                    <TableCell
                                        rowSpan={rGroup.count}
                                        style={{
                                            backgroundColor: primaryColor,
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            padding: '4px',
                                            width: cellSize,
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
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            {rGroup.label}
                                        </div>
                                    </TableCell>
                                )}

                                {/* LABEL RECEIVER */}
                                <TableCell
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        borderRight: `3px solid ${nodeLineColor}`,
                                        borderBottom: isLastRNode
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        padding: '0 8px',
                                        position: 'sticky',
                                        left: cellSize,
                                        zIndex: 5,
                                        width: 160,
                                        boxSizing: 'border-box',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        style={{
                                            color: '#000',
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {receiver.label}
                                    </Typography>
                                </TableCell>

                                {/* CROSSPOINTS QUADRATI */}
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
                                                width: cellSize,
                                                height: cellSize,
                                                padding: 0,
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            {isConnected ? (
                                                <CheckCircleIcon
                                                    style={{
                                                        color: activeGreen,
                                                        fontSize: '1.2rem',
                                                        display: 'block',
                                                        margin: 'auto',
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        color: '#eee',
                                                        fontSize: '1rem',
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
