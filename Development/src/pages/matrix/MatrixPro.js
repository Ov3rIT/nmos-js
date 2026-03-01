import React, { useMemo, useState } from 'react';
import { useTheme } from '@material-ui/core/styles';
import { Paper, Typography } from '@material-ui/core';
import { useRedirect } from 'react-admin';

const CELL = 48;
const LABEL_WIDTH = 220;

const MatrixPro = ({ senders, receivers, devices, connections, onConnect }) => {
    const theme = useTheme();
    const redirect = useRedirect();
    const isDark = theme.palette.type === 'dark';

    const [hoverRow, setHoverRow] = useState(null);
    const [hoverCol, setHoverCol] = useState(null);

    const primary = theme.palette.primary.main;
    const divider = theme.palette.divider;
    const surface = theme.palette.background.paper;

    const activeColor =
        theme.palette.success?.main || theme.palette.primary.main;

    const crossRow = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    const crossCol = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const senderGroups = useMemo(() => {
        const map = {};
        senders.forEach(s => {
            if (!map[s.device_id]) {
                const dev = devices.find(d => d.id === s.device_id);
                map[s.device_id] = {
                    label: dev?.label || 'Device',
                    items: [],
                };
            }
            map[s.device_id].items.push(s);
        });
        return Object.values(map);
    }, [senders, devices]);

    const receiverGroups = useMemo(() => {
        const map = {};
        receivers.forEach(r => {
            if (!map[r.device_id]) {
                const dev = devices.find(d => d.id === r.device_id);
                map[r.device_id] = {
                    label: dev?.label || 'Device',
                    items: [],
                };
            }
            map[r.device_id].items.push(r);
        });
        return Object.values(map);
    }, [receivers, devices]);

    return (
        <Paper
            style={{
                height: '100%',
                overflow: 'auto',
                background: surface,
                padding: 16,
            }}
        >
            {/* ================= HEADER SENDERS ================= */}

            <div style={{ display: 'flex' }}>
                <div style={{ width: LABEL_WIDTH }} />

                {senderGroups.map((group, gIdx) => (
                    <div
                        key={gIdx}
                        style={{
                            display: 'flex',
                            borderLeft: `1px solid ${divider}`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderBottom: `2px solid ${primary}`,
                            }}
                        >
                            <Typography
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {group.label}
                            </Typography>

                            <div style={{ display: 'flex' }}>
                                {group.items.map((sender, sIdx) => (
                                    <div
                                        key={sender.id}
                                        onClick={() =>
                                            redirect(`/senders/${sender.id}`)
                                        }
                                        style={{
                                            width: CELL,
                                            height: 80,
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                            borderLeft:
                                                sIdx === 0
                                                    ? `2px solid ${primary}`
                                                    : `1px solid ${divider}`,
                                        }}
                                    >
                                        {sender.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= BODY ================= */}

            {receiverGroups.map((group, gIdx) => (
                <div key={gIdx}>
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            marginTop: 16,
                            marginBottom: 4,
                            borderBottom: `1px solid ${divider}`,
                        }}
                    >
                        {group.label}
                    </div>

                    {group.items.map((receiver, rIdx) => {
                        const globalRowIndex = receivers.findIndex(
                            r => r.id === receiver.id
                        );

                        return (
                            <div
                                key={receiver.id}
                                style={{
                                    display: 'flex',
                                    background:
                                        hoverRow === globalRowIndex
                                            ? crossRow
                                            : 'transparent',
                                }}
                            >
                                {/* Receiver label */}
                                <div
                                    onClick={() =>
                                        redirect(`/receivers/${receiver.id}`)
                                    }
                                    style={{
                                        width: LABEL_WIDTH,
                                        height: CELL,
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: 8,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        borderRight: `2px solid ${primary}`,
                                    }}
                                >
                                    {receiver.label}
                                </div>

                                {/* Matrix cells */}
                                {senders.map((sender, sIdx) => {
                                    const isActive =
                                        connections[receiver.id] === sender.id;

                                    return (
                                        <div
                                            key={`${receiver.id}-${sender.id}`}
                                            onMouseEnter={() => {
                                                setHoverRow(globalRowIndex);
                                                setHoverCol(sIdx);
                                            }}
                                            onClick={() =>
                                                onConnect(
                                                    receiver,
                                                    sender,
                                                    !isActive
                                                )
                                            }
                                            style={{
                                                width: CELL,
                                                height: CELL,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                background:
                                                    hoverCol === sIdx
                                                        ? crossCol
                                                        : undefined,
                                                borderLeft:
                                                    sIdx === 0
                                                        ? `2px solid ${primary}`
                                                        : `1px solid ${divider}`,
                                                borderBottom: `1px solid ${divider}`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    background: isActive
                                                        ? activeColor
                                                        : 'transparent',
                                                    boxShadow: isActive
                                                        ? `0 0 6px ${activeColor}`
                                                        : 'none',
                                                    border: `1px solid ${divider}`,
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            ))}
        </Paper>
    );
};

export default MatrixPro;
