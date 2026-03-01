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
import React, { useState } from 'react';
import { useRedirect } from 'react-admin';

const MatrixBase = ({
    senders,
    receivers,
    devices,
    connections,
    onConnect,
    primaryColor,
    lightBg,
}) => {
    const [hoveredRow, setHoveredRow] = useState(null);
    const [hoveredCol, setHoveredCol] = useState(null);

    const redirect = useRedirect();

    // COSTANTE RIGIDA: Se vuoi celle più grandi o piccole, cambia solo questo numero
    const cellSize = 50;

    const gridLineColor = '#ddd';
    const nodeLineColor = 'rgb(1, 80, 72)';
    const activeGreen = '#27ae60';
    const crosshairColor = 'rgba(2, 112, 101, 0.12)';

    const getDeviceLabel = deviceId => {
        const dev = devices?.find(d => d.id === deviceId);
        return dev ? dev.label : 'Unknown Device';
    };

    const isLastInGroup = (idx, arr, key) =>
        idx === arr.length - 1 || arr[idx][key] !== arr[idx + 1][key];
    const isFirstInGroup = (idx, arr, key) =>
        idx === 0 || arr[idx][key] !== arr[idx - 1][key];

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
            onMouseLeave={() => {
                setHoveredRow(null);
                setHoveredCol(null);
            }}
            style={{
                backgroundColor: '#fff',
                boxShadow: 'none',
                height: '100%', // ✅ prende tutta l’altezza del Box padre
                overflow: 'auto', // ✅ lo scroll avviene qui dentro
            }}
        >
            {/* TABLE-LAYOUT FIXED è fondamentale per i quadrati */}
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
                    <TableRow style={{ height: cellSize }}>
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: cellSize,
                                position: 'sticky',
                                top: 0, // ✅ prima riga header incollata al top
                                left: 0,
                                zIndex: 60, // sopra tutto
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: lightBg,
                                borderBottom: `3px solid ${nodeLineColor}`,
                                width: 180,
                                position: 'sticky',
                                top: 0, // ✅ prima riga header incollata al top
                                left: cellSize,
                                zIndex: 60,
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
                                    borderRight:
                                        idx ===
                                        Object.values(senderGroups).length - 1
                                            ? `3px solid ${nodeLineColor}`
                                            : 'none',
                                    height: cellSize,
                                    boxSizing: 'border-box',
                                    padding: '2px',

                                    // ✅ prima riga header sticky
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 50,
                                }}
                            >
                                {group.label}
                            </TableCell>
                        ))}
                    </TableRow>

                    <TableRow style={{ height: 140 }}>
                        {/* Altezza fissa per i nomi verticali */}
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
                                top: cellSize, // ✅ sotto la prima riga header
                                zIndex: 55,
                                textAlign: 'center',
                            }}
                        >
                            Destinazioni
                        </TableCell>

                        {senders.map((sender, idx) => (
                            <TableCell
                                key={sender.id}
                                align="center"
                                style={{
                                    backgroundColor:
                                        hoveredCol === idx
                                            ? `${primaryColor}20`
                                            : lightBg,
                                    borderBottom: `3px solid ${nodeLineColor}`,
                                    borderLeft: isFirstInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `3px solid ${nodeLineColor}`
                                        : 'none',
                                    borderRight: isLastInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `3px solid ${nodeLineColor}`
                                        : `1px solid ${gridLineColor}`,
                                    width: cellSize,
                                    minWidth: cellSize,
                                    maxWidth: cellSize,
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',

                                    // ✅ seconda riga header sticky
                                    position: 'sticky',
                                    top: cellSize,
                                    zIndex: 45,
                                }}
                            >
                                <div
                                    onClick={e => {
                                        e.stopPropagation();
                                        redirect(`/senders/${sender.id}`);
                                    }}
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        margin: 'auto',
                                        whiteSpace: 'nowrap',
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
                                style={{
                                    height: cellSize,
                                    minHeight: cellSize,
                                    maxHeight: cellSize,
                                    backgroundColor:
                                        hoveredRow === rIdx
                                            ? crosshairColor
                                            : 'transparent',
                                }}
                            >
                                {isFirstR && (
                                    <TableCell
                                        rowSpan={rGroup.count}
                                        style={{
                                            backgroundColor: primaryColor,
                                            color: '#fff',
                                            textAlign: 'center',
                                            width: cellSize,
                                            minWidth: cellSize,
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
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {rGroup.label}
                                        </div>
                                    </TableCell>
                                )}

                                <TableCell
                                    onClick={e => {
                                        e.stopPropagation();
                                        redirect(`/receivers/${receiver.id}`);
                                    }}
                                    style={{
                                        backgroundColor:
                                            hoveredRow === rIdx
                                                ? `${primaryColor}25`
                                                : '#f5f5f5',
                                        borderRight: `3px solid ${nodeLineColor}`,
                                        borderBottom: isLastRNode
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        position: 'sticky',
                                        left: cellSize,
                                        zIndex: 5,
                                        width: 180,
                                        boxSizing: 'border-box',
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
                                            onMouseEnter={() => {
                                                setHoveredRow(rIdx);
                                                setHoveredCol(sIdx);
                                            }}
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
                                                    ? `${activeGreen}22`
                                                    : hoveredRow === rIdx ||
                                                        hoveredCol === sIdx
                                                      ? crosshairColor
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
                                                minWidth: cellSize,
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
                                                        color:
                                                            hoveredRow ===
                                                                rIdx ||
                                                            hoveredCol === sIdx
                                                                ? '#aaa'
                                                                : '#eee',
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
