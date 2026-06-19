import React, { useEffect, useState } from "react";
import {
    Box, Typography, Card, CardContent, CardHeader, Stack, Avatar,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Collapse, IconButton, TextField, Alert,
    CircularProgress, Button, Switch, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import axiosInstance from "../../../axios/axios.js";

const PRIMARY = "#f97316";
const SECONDARY = "#2563eb";

const ZONE_LABELS = {
    CENTAR: "Centar",
    KARPOSH: "Karpoš",
    AERODROM: "Aerodrom",
    KISELA_VODA: "Kisela Voda",
    GAZI_BABA: "Gazi Baba",
    BUTEL: "Butel",
};

const statusColor = (s) => {
    if (s === "DELIVERED") return "success";
    if (s === "CANCELED") return "error";
    if (s === "CONFIRMED") return "info";
    if (s === "PICKED_UP") return "warning";
    return "default";
};

const AuditRow = ({ entry }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow sx={{ "& > *": { borderBottom: open ? "unset" : undefined }, "&:hover": { bgcolor: "#fafafa" } }}>
                <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell><Typography fontWeight={700}>#{entry.orderId}</Typography></TableCell>
                <TableCell>
                    <Stack>
                        <Typography variant="body2">{entry.restaurantName}</Typography>
                        {entry.restaurantZone && (
                            <Chip label={ZONE_LABELS[entry.restaurantZone] || entry.restaurantZone} size="small"
                                  variant="outlined" sx={{ width: "fit-content", mt: 0.3 }} />
                        )}
                    </Stack>
                </TableCell>
                <TableCell><Chip label={entry.status} size="small" color={statusColor(entry.status)} /></TableCell>
                <TableCell>
                    <Chip label={entry.totalOffered + " couriers"} size="small" variant="outlined" sx={{ borderColor: SECONDARY, color: SECONDARY }} />
                </TableCell>
                <TableCell>
                    {entry.acceptedBy
                        ? <Chip label={entry.acceptedBy} size="small" color="success" />
                        : <Chip label="Not accepted yet" size="small" variant="outlined" />}
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                    {entry.placedAt ? new Date(entry.placedAt).toLocaleString() : "—"}
                </TableCell>
                <TableCell><Typography fontWeight={600} color={PRIMARY}>{entry.total?.toFixed(0)} МКД</Typography></TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={8} sx={{ py: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ m: 2, mb: 3 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary"
                                        sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.5 }}>
                                Algorithm Offer Details
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Rank</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Courier</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Courier Zone</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Score</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Score Breakdown</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Offered At</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Accepted?</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(entry.offeredTo || []).map((offer, i) => (
                                        <TableRow key={offer.courierUsername}
                                                  sx={{ bgcolor: offer.accepted ? "#f0fdf4" : undefined }}>
                                            <TableCell>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 12,
                                                    bgcolor: i === 0 ? PRIMARY : i === 1 ? SECONDARY : "#64748b" }}>
                                                    {i + 1}
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <Stack>
                                                    <Typography variant="body2" fontWeight={600}>{offer.courierName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">@{offer.courierUsername}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {offer.courierZone
                                                    ? <Chip label={ZONE_LABELS[offer.courierZone] || offer.courierZone} size="small" variant="outlined" />
                                                    : <Chip label="Not set" size="small" variant="outlined" />}
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color={PRIMARY}>{offer.score?.toFixed(1)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                                    {offer.scoreBreakdown || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                                                {offer.offeredAt ? new Date(offer.offeredAt).toLocaleTimeString() : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {offer.accepted
                                                    ? <Chip label="✓ Accepted" size="small" color="success" />
                                                    : <Chip label="Declined / Pending" size="small" variant="outlined" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const CourierAuditPage = () => {
    const [tab, setTab] = useState(0);
    const [auditData, setAuditData] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [filter, setFilter] = useState("");
    const [editingCourier, setEditingCourier] = useState(null);
    const [editZone, setEditZone] = useState("");

    const showAlert = (msg, sev = "info") => { setAlertMsg(msg); setAlertSeverity(sev); };

    const loadAudit = async () => {
        try {
            const res = await axiosInstance.get("/admin/couriers/order-audit");
            setAuditData(res.data);
        } catch (e) { showAlert("Failed to load audit: " + (e.response?.data?.message || e.message), "error"); }
    };

    const loadCouriers = async () => {
        try {
            const res = await axiosInstance.get("/admin/couriers");
            setCouriers(res.data);
        } catch (e) { showAlert("Failed to load couriers: " + (e.response?.data?.message || e.message), "error"); }
    };

    useEffect(() => {
        Promise.all([loadAudit(), loadCouriers()]).finally(() => setLoading(false));
    }, []);

    const saveZone = async (courierId) => {
        try {
            await axiosInstance.put(`/admin/couriers/${courierId}/zone`, { zone: editZone });
            setEditingCourier(null);
            await loadCouriers();
            showAlert("Zone updated successfully.", "success");
        } catch (e) { showAlert("Failed: " + (e.response?.data?.message || e.message), "error"); }
    };

    const toggleActive = async (courier) => {
        try {
            await axiosInstance.put(`/admin/couriers/${courier.id}/active`, { active: !courier.active });
            await loadCouriers();
        } catch (e) { showAlert("Failed to update: " + (e.response?.data?.message || e.message), "error"); }
    };

    const filteredAudit = auditData.filter(e =>
        !filter || String(e.orderId).includes(filter) ||
        e.restaurantName?.toLowerCase().includes(filter.toLowerCase()) ||
        e.acceptedBy?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <Box textAlign="center" pt={8}><CircularProgress sx={{ color: PRIMARY }} /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 48, height: 48 }}><AdminPanelSettingsIcon /></Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Courier Management</Typography>
                    <Typography variant="body2" color="text.secondary">Assignment audit & courier zones</Typography>
                </Box>
                <Box flex={1} />
                <Stack direction="row" spacing={1}>
                    <Button variant={tab === 0 ? "contained" : "outlined"} startIcon={<ReceiptLongIcon />}
                            onClick={() => setTab(0)} sx={tab === 0 ? { bgcolor: PRIMARY } : { borderColor: PRIMARY, color: PRIMARY }}>
                        Order Audit
                    </Button>
                    <Button variant={tab === 1 ? "contained" : "outlined"} startIcon={<DeliveryDiningIcon />}
                            onClick={() => setTab(1)} sx={tab === 1 ? { bgcolor: PRIMARY } : { borderColor: PRIMARY, color: PRIMARY }}>
                        Manage Couriers
                    </Button>
                </Stack>
            </Stack>

            {alertMsg && <Alert severity={alertSeverity} onClose={() => setAlertMsg(null)} sx={{ mb: 2 }}>{alertMsg}</Alert>}

            {tab === 0 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader
                        title={<Typography variant="h6" fontWeight={700}>Order Courier Audit</Typography>}
                        subheader="Expand each row to see which couriers were offered the order, their zone-based scores, and who accepted."
                        action={
                            <TextField size="small" placeholder="Filter by order, restaurant, courier…"
                                       value={filter} onChange={e => setFilter(e.target.value)} sx={{ mr: 1, width: 280 }} />
                        }
                    />
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        {["", "Order", "Restaurant", "Status", "Offered To", "Accepted By", "Placed At", "Total"].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAudit.map(entry => <AuditRow key={entry.orderId} entry={entry} />)}
                                    {filteredAudit.length === 0 && (
                                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                            No orders with courier offers yet.
                                        </TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {tab === 1 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader
                        title={<Typography variant="h6" fontWeight={700}>Couriers</Typography>}
                        subheader="Set zone and active status for each courier. No GPS — zones are a simplified proximity model."
                    />
                    <CardContent sx={{ p: 0 }}>
                        <Alert severity="info" sx={{ m: 2 }}>
                            <strong>Scoring formula:</strong> Base 40 + Rating×6 (max 30) + Proximity = max(0, 30 − zoneDistanceMinutes×1.5).
                            Zone distance comes from a fixed travel-time matrix between Skopje zones (e.g. Centar→Karpoš ≈ 8 min).
                        </Alert>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        {["Courier", "Username", "Phone", "Active", "Current Zone", ""].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {couriers.map(c => (
                                        <TableRow key={c.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                                            <TableCell><Typography fontWeight={600}>{c.name}</Typography></TableCell>
                                            <TableCell><Chip label={`@${c.username}`} size="small" sx={{ fontFamily: "monospace", bgcolor: "#f1f5f9" }} /></TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>{c.phone || "—"}</TableCell>
                                            <TableCell>
                                                <Switch checked={!!c.active} onChange={() => toggleActive(c)} size="small"
                                                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: PRIMARY }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PRIMARY } }} />
                                            </TableCell>
                                            <TableCell>
                                                {editingCourier === c.id ? (
                                                    <FormControl size="small" sx={{ minWidth: 160 }}>
                                                        <Select value={editZone} onChange={e => setEditZone(e.target.value)} displayEmpty>
                                                            <MenuItem value=""><em>Not set</em></MenuItem>
                                                            {Object.entries(ZONE_LABELS).map(([k, label]) => (
                                                                <MenuItem key={k} value={k}>{label}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    c.currentZone
                                                        ? <Chip label={ZONE_LABELS[c.currentZone] || c.currentZone} size="small" color="primary" variant="outlined" />
                                                        : <Chip label="Not set" size="small" variant="outlined" />
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editingCourier === c.id ? (
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button size="small" variant="contained" startIcon={<SaveIcon />}
                                                                sx={{ bgcolor: PRIMARY }} onClick={() => saveZone(c.id)}>Save</Button>
                                                        <Button size="small" onClick={() => setEditingCourier(null)}>Cancel</Button>
                                                    </Stack>
                                                ) : (
                                                    <IconButton size="small" sx={{ color: SECONDARY }}
                                                                onClick={() => { setEditingCourier(c.id); setEditZone(c.currentZone || ""); }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default CourierAuditPage;
