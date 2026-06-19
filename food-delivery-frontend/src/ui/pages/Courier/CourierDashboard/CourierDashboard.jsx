import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Card, CardContent, Typography, Button, Chip, Stack, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Alert, CircularProgress, Popover, List, ListItem, ListItemText,
    FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import axiosInstance from "../../../../axios/axios.js";
import useAuth from "../../../../hooks/useAuth.js";

const PRIMARY = "#f97316";

const ZONE_LABELS = {
    CENTAR: "Centar",
    KARPOSH: "Karpoš",
    AERODROM: "Aerodrom",
    KISELA_VODA: "Kisela Voda",
    GAZI_BABA: "Gazi Baba",
    BUTEL: "Butel",
};

const statusColor = (s) => {
    if (s === "CONFIRMED") return "info";
    if (s === "PICKED_UP" || s === "EN_ROUTE") return "warning";
    if (s === "DELIVERED") return "success";
    return "default";
};

const CourierDashboard = () => {
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [myDeliveredOrders, setMyDeliveredOrders] = useState([]);
    const [zones, setZones] = useState([]);
    const [myZone, setMyZone] = useState("");
    const [zoneSaving, setZoneSaving] = useState(false);
    const [zoneSaved, setZoneSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const { user } = useAuth();

    const showAlert = (msg, severity = "info") => { setAlertMsg(msg); setAlertSeverity(severity); };

    const fetchAll = useCallback(async () => {
        try {
            const [availRes, myRes, deliveredRes, zonesRes] = await Promise.all([
                axiosInstance.get("/couriers/my-available-orders"),
                axiosInstance.get("/couriers/my-orders"),
                axiosInstance.get("/couriers/my-delivered-orders"),
                axiosInstance.get("/couriers/zones"),
            ]);
            setAvailableOrders(availRes.data);
            setMyOrders(myRes.data);
            setMyDeliveredOrders(deliveredRes.data);
            setZones(zonesRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const saveZone = async () => {
        if (!myZone) return;
        setZoneSaving(true);
        try {
            await axiosInstance.put("/couriers/my-zone", { zone: myZone });
            setZoneSaved(true);
            showAlert(`Zone set to ${ZONE_LABELS[myZone]}. The algorithm will use this for new order matching.`, "success");
            setTimeout(() => setZoneSaved(false), 3000);
        } catch (e) { showAlert("Failed to save zone: " + (e.response?.data?.message || e.message), "error"); }
        finally { setZoneSaving(false); }
    };

    const handleAccept = async (orderId) => {
        try {
            await axiosInstance.post(`/couriers/assign/${orderId}`);
            await fetchAll();
            showAlert("Order accepted! Good luck with the delivery.", "success");
        } catch (e) {
            showAlert(e.response?.data?.message || "Failed to accept — may have been taken by another courier.", "error");
            await fetchAll();
        }
    };

    const handleComplete = async (orderId) => {
        try {
            await axiosInstance.post(`/couriers/complete/${orderId}`);
            await fetchAll();
            showAlert("Delivery marked as complete!", "success");
        } catch (e) { showAlert("Failed: " + (e.response?.data?.message || e.message), "error"); }
    };

    const OrderTable = ({ orders, showAccept, showComplete }) => (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                        {["Order", "Status", "Restaurant", "Items", "Address", "Total", "Action"].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map(o => (
                        <TableRow key={o.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                            <TableCell><Typography fontWeight={600}>#{o.id}</Typography></TableCell>
                            <TableCell><Chip label={o.status} color={statusColor(o.status)} size="small" /></TableCell>
                            <TableCell>{o.restaurantName}</TableCell>
                            <TableCell>
                                <Button size="small" variant="outlined" sx={{ fontSize: 11 }}
                                        onClick={e => { setAnchorEl(e.currentTarget); setSelectedProducts(o.products || []); }}>
                                    {o.products?.length || 0} items
                                </Button>
                            </TableCell>
                            <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{o.deliveryAddress?.line1 || "—"}</Typography></TableCell>
                            <TableCell><Typography fontWeight={600} color={PRIMARY}>{o.total?.toFixed(0)} МКД</Typography></TableCell>
                            <TableCell>
                                {showAccept && o.status === "CONFIRMED" && (
                                    <Button variant="contained" size="small" sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#ea6d0d" } }}
                                            onClick={() => handleAccept(o.id)}>Accept</Button>
                                )}
                                {showComplete && o.status === "PICKED_UP" && (
                                    <Button variant="contained" color="success" size="small" onClick={() => handleComplete(o.id)}>
                                        Mark Delivered
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {orders.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>No orders</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) return <Box p={4} textAlign="center"><CircularProgress sx={{ color: PRIMARY }} /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 48, height: 48 }}><AccessTimeIcon /></Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Courier Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">Welcome, {user?.username}</Typography>
                </Box>
            </Stack>

            {alertMsg && <Alert severity={alertSeverity} onClose={() => setAlertMsg(null)} sx={{ mb: 2 }}>{alertMsg}</Alert>}

            {/* Zone selector — set once per shift */}
            <Card sx={{ mb: 3, border: `1px solid ${PRIMARY}30`, borderRadius: 2, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <LocationOnIcon sx={{ color: PRIMARY }} />
                        <Typography variant="subtitle1" fontWeight={700}>My Zone</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Pick the area of Skopje you're currently in. Set this once per shift and update it if you move areas.
                        The algorithm uses your zone to find orders near you — no need to do anything else.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>Current Zone</InputLabel>
                            <Select value={myZone} label="Current Zone" onChange={e => setMyZone(e.target.value)}>
                                {zones.map(z => <MenuItem key={z} value={z}>{ZONE_LABELS[z] || z}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Button variant="contained" disabled={!myZone || zoneSaving} onClick={saveZone}
                                sx={{ bgcolor: zoneSaved ? "success.main" : PRIMARY, minWidth: 120,
                                    "&:hover": { bgcolor: zoneSaved ? "success.dark" : "#ea6d0d" } }}>
                            {zoneSaving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : zoneSaved ? "✓ Saved" : "Set Zone"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Orders offered to this courier */}
            <Card sx={{ mb: 3, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={0.5}>Orders Available to You</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        These orders were matched to you by the algorithm based on your zone and rating.
                        First courier to accept gets it.
                    </Typography>
                    <OrderTable orders={availableOrders} showAccept />
                </CardContent>
            </Card>

            {/* Active deliveries */}
            <Card sx={{ mb: 3, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>My Active Deliveries</Typography>
                    <OrderTable orders={myOrders.filter(o => o.status !== "DELIVERED")} showComplete />
                </CardContent>
            </Card>

            {/* Delivered */}
            <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>My Delivered Orders</Typography>
                    <OrderTable orders={myDeliveredOrders} />
                </CardContent>
            </Card>

            <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
                     anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
                <Box sx={{ p: 2, minWidth: 180 }}>
                    {selectedProducts.length > 0 ? (
                        <List dense>
                            {selectedProducts.map((p, i) => (
                                <ListItem key={i} disablePadding>
                                    <ListItemText primary={p.name} secondary={p.price ? `${p.price} МКД` : undefined} />
                                </ListItem>
                            ))}
                        </List>
                    ) : <Typography color="text.secondary" variant="body2">No items</Typography>}
                </Box>
            </Popover>
        </Box>
    );
};

export default CourierDashboard;
