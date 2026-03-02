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
import { useTheme } from '@material-ui/core/styles';

const MatrixBase = ({
    senders,
    receivers,
    devices,
    connections,
    onConnect,
}) => {
    const theme = useTheme();
    const redirect = useRedirect();

    const isDark = theme.palette.type === 'dark';

    const [hoveredRow, setHoveredRow] = useState(null);
    const [hoveredCol, setHoveredCol] = useState(null);

    const cellSize = 50;

    /* ================= THEME COLORS ================= */

    const primary = theme.palette.primary.main;
    const headerText = theme.palette.primary.contrastText;

    const surfaceBg = theme.palette.background.paper;
    const headerBg = theme.palette.background.paper;
    const gridLineColor = theme.palette.divider;
    const nodeLineColor = primary;

    const activeGreen =
        theme.palette.success?.main || theme.palette.primary.main;

    const crosshairColor = theme.palette.action.hover;

    const headerBottomLine = `inset 0 -3px 0 ${nodeLineColor}`;

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
                backgroundColor: surfaceBg,
                boxShadow: 'none',
                height: '100%',
                overflow: 'auto',
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
                    {/* ================= ROW 1 - DEVICE GROUPS ================= */}
                    <TableRow style={{ height: cellSize }}>
                        <TableCell
                            style={{
                                backgroundColor: headerBg,
                                width: cellSize,
                                position: 'sticky',
                                top: 0,
                                left: 0,
                                zIndex: 100,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: headerBg,
                                width: 180,
                                position: 'sticky',
                                top: 0,
                                left: cellSize,
                                zIndex: 100,
                            }}
                        />

                        {Object.values(senderGroups).map((group, idx, arr) => {
                            const isLast = idx === arr.length - 1;

                            const headerBackground = isDark
                                ? theme.palette.primary.dark
                                : theme.palette.primary.main;

                            const separatorColor = isDark
                                ? 'rgba(255,255,255,0.25)'
                                : 'rgba(255,255,255,0.6)';

                            return (
                                <TableCell
                                    key={idx}
                                    align="center"
                                    colSpan={group.count}
                                    style={{
                                        backgroundColor: headerBackground,
                                        color: headerText,
                                        fontWeight: 600,
                                        fontSize: '0.72rem',
                                        letterSpacing: 0.5,

                                        borderLeft: `1px solid ${nodeLineColor}`,
                                        borderRight: isLast
                                            ? `1px solid ${nodeLineColor}`
                                            : 'none',

                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 90,
                                    }}
                                >
                                    {group.label}
                                </TableCell>
                            );
                        })}
                    </TableRow>

                    {/* ================= ROW 2 - SENDERS ================= */}
                    <TableRow style={{ height: 140 }}>
                        <TableCell
                            colSpan={2}
                            style={{
                                backgroundColor: headerBg,
                                color: primary,
                                fontWeight: 'bold',
                                borderRight: `1px solid ${nodeLineColor}`,
                                position: 'sticky',
                                left: 0,
                                top: cellSize,
                                zIndex: 95,
                                textAlign: 'center',
                            }}
                        >
                            Destinazioni
                        </TableCell>

                        {senders.map((sender, idx) => (
                            <TableCell
                                key={sender.id}
                                align="center"
                                onMouseEnter={() => setHoveredCol(idx)}
                                style={{
                                    backgroundColor: headerBg,

                                    borderLeft: isFirstInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `1px solid ${nodeLineColor}`
                                        : 'none',

                                    borderRight: isLastInGroup(
                                        idx,
                                        senders,
                                        'device_id'
                                    )
                                        ? `1px solid ${nodeLineColor}`
                                        : `1px solid ${gridLineColor}`,

                                    position: 'sticky',
                                    top: cellSize,
                                    zIndex: 85,

                                    width: cellSize,
                                    minWidth: cellSize,
                                    maxWidth: cellSize,
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
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {sender.label}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                {/* ================= BODY ================= */}
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
                                            backgroundColor: primary,
                                            color: headerText,
                                            borderBottom: `1px solid ${nodeLineColor}`,
                                            borderRight: `1px solid ${nodeLineColor}`,
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 10,
                                            width: cellSize,
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
                                    onClick={() =>
                                        redirect(`/receivers/${receiver.id}`)
                                    }
                                    style={{
                                        backgroundColor:
                                            hoveredRow === rIdx
                                                ? theme.palette.action.hover
                                                : surfaceBg,

                                        borderRight: `1px solid ${nodeLineColor}`,
                                        borderBottom: isLastRNode
                                            ? `1px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,

                                        position: 'sticky',
                                        left: cellSize,
                                        zIndex: 10,
                                        width: 180,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        style={{
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
                                            onClick={() =>
                                                onConnect(
                                                    receiver,
                                                    sender,
                                                    !isConnected
                                                )
                                            }
                                            onMouseEnter={() => {
                                                setHoveredRow(rIdx);
                                                setHoveredCol(sIdx);
                                            }}
                                            style={{
                                                cursor: 'pointer',

                                                backgroundColor: isConnected
                                                    ? `${activeGreen}22`
                                                    : hoveredRow === rIdx ||
                                                        hoveredCol === sIdx
                                                      ? crosshairColor
                                                      : 'transparent',

                                                borderLeft: isFirstSNode
                                                    ? `1px solid ${nodeLineColor}`
                                                    : 'none',

                                                borderRight: isLastSNode
                                                    ? `1px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,

                                                borderBottom: isLastRNode
                                                    ? `1px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,

                                                width: cellSize,
                                                height: cellSize,
                                                padding: 0,
                                            }}
                                        >
                                            {isConnected ? (
                                                <CheckCircleIcon
                                                    style={{
                                                        color: activeGreen,
                                                        fontSize: '1.2rem',
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        color: theme.palette
                                                            .text.disabled,
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
