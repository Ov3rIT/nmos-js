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
    primaryColor,
    lightBg,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.type === 'dark';

    const [hoveredRow, setHoveredRow] = useState(null);
    const [hoveredCol, setHoveredCol] = useState(null);

    const redirect = useRedirect();

    const cellSize = 50;

    /* =======================
       🎨 COLORI LEGATI AL TEMA
       ======================= */

    const primary = primaryColor || theme.palette.primary.main;
    const headerBg = primary;
    const headerText = theme.palette.primary.contrastText;

    const surfaceBg = theme.palette.background.paper;
    const secondaryBg = theme.palette.action.hover;
    const gridLineColor = theme.palette.divider;
    const nodeLineColor = primary;

    const activeGreen = theme.palette.success
        ? theme.palette.success.main
        : '#27ae60';

    const crosshairColor = theme.palette.action.selected;

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
                    {/* ================= HEADER RIGA 1 ================= */}
                    <TableRow style={{ height: cellSize }}>
                        <TableCell
                            style={{
                                backgroundColor: surfaceBg,
                                boxShadow: headerBottomLine,
                                borderBottom: 'none',
                                width: cellSize,
                                position: 'sticky',
                                top: 0,
                                left: 0,
                                zIndex: 60,
                            }}
                        />
                        <TableCell
                            style={{
                                backgroundColor: surfaceBg,
                                boxShadow: headerBottomLine,
                                borderBottom: 'none',
                                width: 180,
                                position: 'sticky',
                                top: 0,
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
                                    backgroundColor: headerBg,
                                    color: headerText,
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem',
                                    borderLeft: `3px solid ${nodeLineColor}`,
                                    borderRight:
                                        idx ===
                                        Object.values(senderGroups).length - 1
                                            ? `3px solid ${nodeLineColor}`
                                            : 'none',
                                    boxShadow: headerBottomLine,
                                    borderBottom: 'none',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 50,
                                }}
                            >
                                {group.label}
                            </TableCell>
                        ))}
                    </TableRow>

                    {/* ================= HEADER RIGA 2 ================= */}
                    <TableRow style={{ height: 140 }}>
                        <TableCell
                            colSpan={2}
                            style={{
                                backgroundColor: surfaceBg,
                                color: primary,
                                fontWeight: 'bold',
                                boxShadow: headerBottomLine,
                                borderBottom: 'none',
                                borderRight: `3px solid ${nodeLineColor}`,
                                position: 'sticky',
                                left: 0,
                                top: cellSize,
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
                                            ? theme.palette.action.hover
                                            : surfaceBg,
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
                                    boxShadow: headerBottomLine,
                                    borderBottom: 'none',
                                    position: 'sticky',
                                    top: cellSize,
                                    zIndex: 45,
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
                                            backgroundColor: headerBg,
                                            color: headerText,
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
                                                ? secondaryBg
                                                : surfaceBg,
                                        borderRight: `3px solid ${nodeLineColor}`,
                                        borderBottom: isLastRNode
                                            ? `3px solid ${nodeLineColor}`
                                            : `1px solid ${gridLineColor}`,
                                        position: 'sticky',
                                        left: cellSize,
                                        zIndex: 5,
                                        width: 180,
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
                                                borderBottom: isLastRNode
                                                    ? `3px solid ${nodeLineColor}`
                                                    : `1px solid ${gridLineColor}`,
                                                borderRight: `1px solid ${gridLineColor}`,
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
