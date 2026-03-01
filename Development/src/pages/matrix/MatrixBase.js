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
        if (!acc[devId]) {
            acc[devId] = {
                label: getDeviceLabel(devId),
                count: 0,
                firstId: r.id,
            };
        }
        acc[devId].count++;
        return acc;
    }, {});

    return (
        <Paper
            onMouseLeave={() => {
                setHoveredRow(null);
                setHoveredCol(null);
            }}
            style={{
                backgroundColor: '#fff',
                boxShadow: 'none',
                height: '100%',
                overflow: 'auto',
            }}
        >
            <TableContainer>
                <Table stickyHeader style={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                style={{
                                    backgroundColor: lightBg,
                                    fontWeight: 'bold',
                                    width: 240,
                                    minWidth: 240,
                                }}
                            >
                                <Typography variant="subtitle2">
                                    Destinazioni
                                </Typography>
                            </TableCell>

                            {senders.map((sender, idx) => (
                                <TableCell
                                    key={sender.id}
                                    align="center"
                                    style={{
                                        backgroundColor: lightBg,
                                        padding: 6,
                                        width: cellSize,
                                        minWidth: cellSize,
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
                                    }}
                                >
                                    <div
                                        // ✅ CLICK SU LABEL SENDER -> /#/senders/{id}
                                        onClick={e => {
                                            e.stopPropagation();
                                            redirect(`/senders/${sender.id}`);
                                        }}
                                        style={{
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                            whiteSpace: 'nowrap',
                                            height: 140,
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: primaryColor,
                                        }}
                                        title={sender.label}
                                    >
                                        {sender.label}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>

                        {/* Row con i gruppi dei sender (device) */}
                        <TableRow>
                            <TableCell
                                style={{
                                    backgroundColor: '#fff',
                                    borderBottom: `3px solid ${nodeLineColor}`,
                                    width: 240,
                                    minWidth: 240,
                                }}
                            />
                            {Object.values(senderGroups).map((group, idx) => (
                                <TableCell
                                    key={`${group.label}-${idx}`}
                                    colSpan={group.count}
                                    align="center"
                                    style={{
                                        backgroundColor: '#fff',
                                        borderBottom: `3px solid ${nodeLineColor}`,
                                        fontWeight: 700,
                                        color: nodeLineColor,
                                        fontSize: 12,
                                    }}
                                >
                                    {group.label}
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
                                <TableRow key={receiver.id}>
                                    <TableCell
                                        // ✅ CLICK SU LABEL RECEIVER -> /#/receivers/{id}
                                        onClick={e => {
                                            e.stopPropagation();
                                            redirect(
                                                `/receivers/${receiver.id}`
                                            );
                                        }}
                                        style={{
                                            width: 240,
                                            minWidth: 240,
                                            fontWeight: 600,
                                            borderBottom: isLastRNode
                                                ? `3px solid ${nodeLineColor}`
                                                : `1px solid ${gridLineColor}`,
                                        }}
                                        title={receiver.label}
                                    >
                                        {isFirstR && (
                                            <Typography
                                                variant="caption"
                                                style={{
                                                    display: 'block',
                                                    color: nodeLineColor,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {rGroup.label}
                                            </Typography>
                                        )}
                                        <Typography variant="body2">
                                            {receiver.label}
                                        </Typography>
                                    </TableCell>

                                    {senders.map((sender, sIdx) => {
                                        const isConnected =
                                            connections[receiver.id] ===
                                            sender.id;
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
                                                title={`Connetti ${sender.label} → ${receiver.label}`}
                                            >
                                                {isConnected ? (
                                                    <CheckCircleIcon
                                                        style={{
                                                            color: activeGreen,
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            opacity: 0.35,
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
        </Paper>
    );
};

export default MatrixBase;
