import React, { useEffect, useRef, useState } from "react";
import {
    Alert, Avatar, Box, Button, Card, CardContent, CardHeader, Chip,
    CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, FormControl, Grid, IconButton, InputLabel, LinearProgress,
    MenuItem, Paper, Select, Stack, Switch, Tab, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tabs, TextField,
    Tooltip, Typography, Collapse,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CancelIcon from "@mui/icons-material/Cancel";
import StorefrontIcon from "@mui/icons-material/Storefront";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { ownerRepository } from "../../../repository/ownerRepository.js";

const PRIMARY = "#f97316";
const SECONDARY = "#2563eb";
const STATUS_COLORS = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };
const PIE_COLORS = ["#f97316", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const CSV_TEMPLATE = `name,description,price,category,imageUrl,quantity\nMargherita Pizza,Classic tomato and mozzarella,450,Pizza,https://example.com/pizza.jpg,100\nCaesar Salad,Romaine lettuce with caesar dressing,320,Salads,,100\nCoca Cola,330ml can,80,Drinks,,200`;

const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "menu_template.csv"; a.click();
    URL.revokeObjectURL(url);
};

const StatCard = ({ icon, label, value, color = PRIMARY, sub }) => (
    <Card sx={{ height: "100%", borderTop: `3px solid ${color}`, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ pb: "16px !important" }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>{value ?? "—"}</Typography>
                    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                </Box>
                <Avatar sx={{ bgcolor: color + "18", color, width: 44, height: 44, mt: 0.5 }}>{icon}</Avatar>
            </Stack>
        </CardContent>
    </Card>
);

const SectionCard = ({ title, icon, children, action }) => (
    <Card sx={{ height: "100%", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
        <CardHeader
            title={<Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: PRIMARY + "18", color: PRIMARY, width: 32, height: 32 }}>{icon}</Avatar>
                <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            </Stack>}
            action={action} sx={{ pb: 0 }} />
        <CardContent>{children}</CardContent>
    </Card>
);

// Expandable order row with items
const OrderRow = ({ o }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow sx={{ "&:hover": { bgcolor: "#fafafa" }, "& > *": { borderBottom: open ? "unset" : undefined } }}>
                <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell><Typography fontWeight={600}>#{o.orderId}</Typography></TableCell>
                <TableCell><Chip label={o.anonymizedCustomerId} size="small" sx={{ bgcolor: "#f1f5f9", fontFamily: "monospace" }} /></TableCell>
                <TableCell>
                    <Chip label={o.status} size="small"
                          color={o.status === "DELIVERED" ? "success" : o.status === "CANCELED" ? "error" : o.status === "CONFIRMED" ? "info" : "default"}
                          variant={o.status === "DELIVERED" ? "filled" : "outlined"} />
                </TableCell>
                <TableCell>{o.items?.length ?? 0} items</TableCell>
                <TableCell><Typography fontWeight={600} color={PRIMARY}>{o.total?.toFixed(0)} МКД</Typography></TableCell>
                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{o.placedAt ? new Date(o.placedAt).toLocaleString() : "—"}</TableCell>
                <TableCell>{o.deliveryArea || "—"}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={8} sx={{ py: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ m: 1.5, mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                Order Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="center">Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Unit Price</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(o.items || []).map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">{item.unitPrice?.toFixed(0)} МКД</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {(item.quantity * item.unitPrice)?.toFixed(0)} МКД
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

// Inline editable product row — edits and deletes are submitted as change requests for admin approval
const ProductRow = ({ product, restaurantId, onRequested, showAlert }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...product });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                price: form.price !== "" && form.price != null ? Number(form.price) : undefined,
                category: form.category,
                imageUrl: form.imageUrl,
                quantity: form.quantity !== "" && form.quantity != null ? Number(form.quantity) : undefined,
                isAvailable: form.isAvailable,
            };
            await ownerRepository.submitProductEditRequest(restaurantId, product.id, payload);
            setEditing(false);
            setForm({ ...product });
            showAlert("Edit request submitted — waiting for admin approval.", "success");
            onRequested && onRequested();
        } catch (e) {
            showAlert("Could not submit edit request: " + (e.response?.data?.message || e.message), "error");
        } finally { setSaving(false); }
    };

    const del = async () => {
        if (!window.confirm(`Submit a delete request for "${product.name}"? An admin must approve it before it is removed.`)) return;
        try {
            await ownerRepository.submitProductDeleteRequest(restaurantId, product.id);
            showAlert("Delete request submitted — waiting for admin approval.", "success");
            onRequested && onRequested();
        } catch (e) {
            showAlert("Could not submit delete request: " + (e.response?.data?.message || e.message), "error");
        }
    };

    const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })), size: "small" });

    return (
        <TableRow sx={{ bgcolor: editing ? "#fff7ed" : undefined, "&:hover": { bgcolor: editing ? "#fff7ed" : "#fafafa" } }}>
            <TableCell sx={{ width: 56 }}>
                {form.imageUrl ? (
                    <Box component="img" src={form.imageUrl} alt={form.name}
                         sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: 1 }}
                         onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                    <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RestaurantMenuIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                    </Box>
                )}
            </TableCell>
            <TableCell>
                {editing ? <TextField {...f("name")} fullWidth placeholder="Name" /> : <Typography fontWeight={600}>{product.name}</Typography>}
            </TableCell>
            <TableCell>
                {editing ? <TextField {...f("description")} fullWidth placeholder="Description" /> : <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{product.description}</Typography>}
            </TableCell>
            <TableCell>
                {editing ? <TextField {...f("price")} type="number" sx={{ width: 100 }} /> : <Typography fontWeight={600} color={PRIMARY}>{product.price?.toFixed(0)} МКД</Typography>}
            </TableCell>
            <TableCell>
                {editing ? <TextField {...f("category")} sx={{ width: 110 }} /> : <Chip label={product.category || "—"} size="small" variant="outlined" />}
            </TableCell>
            <TableCell>
                {editing
                    ? <TextField {...f("imageUrl")} fullWidth placeholder="https://..." sx={{ minWidth: 160 }} />
                    : <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140, display: "block" }}>{product.imageUrl || "—"}</Typography>}
            </TableCell>
            <TableCell align="center">
                {editing ? <TextField {...f("quantity")} type="number" sx={{ width: 80 }} /> : product.quantity}
            </TableCell>
            <TableCell align="center">
                {editing
                    ? <Switch checked={!!form.isAvailable} onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))} size="small" />
                    : <Chip label={product.isAvailable ? "Available" : "Hidden"} size="small" color={product.isAvailable ? "success" : "default"} variant="outlined" />}
            </TableCell>
            <TableCell align="right">
                {editing ? (
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Submit edit request"><IconButton size="small" color="success" onClick={save} disabled={saving}><SaveIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Cancel"><IconButton size="small" onClick={() => { setEditing(false); setForm({ ...product }); }}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Request edit"><IconButton size="small" sx={{ color: SECONDARY }} onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Request deletion"><IconButton size="small" color="error" onClick={del}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                )}
            </TableCell>
        </TableRow>
    );
};

const OwnerDashboard = () => {
    const [tab, setTab] = useState(0);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [orders, setOrders] = useState([]);
    const [changeRequests, setChangeRequests] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editDialog, setEditDialog] = useState({ open: false, type: null, payload: {} });
    const [promoDialog, setPromoDialog] = useState({ open: false });
    const [promoData, setPromoData] = useState({ promotionName: "", discountPercent: "", discountAmount: "", description: "", validFrom: "", validUntil: "" });
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [csvFile, setCsvFile] = useState(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvResult, setCsvResult] = useState(null);
    const [menuFilter, setMenuFilter] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => { loadData(); }, []);

    const showAlert = (msg, severity = "info") => { setAlertMsg(msg); setAlertSeverity(severity); };

    const loadData = async () => {
        // Restaurants are critical for the whole dashboard, so load them on their own.
        // Auxiliary calls (orders / change requests / promotions) must never be able to
        // blank the restaurant list if one of them fails.
        try {
            const restRes = await ownerRepository.getMyRestaurants();
            setRestaurants(restRes.data);
            if (restRes.data.length > 0) setSelectedRestaurant(restRes.data[0]);
        } catch (e) {
            showAlert("Failed to load restaurants: " + (e.response?.data?.message || e.message), "error");
        } finally {
            setLoading(false);
        }

        const [ordersRes, reqRes, promoRes] = await Promise.allSettled([
            ownerRepository.getMyOrders(),
            ownerRepository.getMyChangeRequests(),
            ownerRepository.getMyPromotions(),
        ]);
        if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.data);
        if (reqRes.status === "fulfilled") setChangeRequests(reqRes.value.data);
        if (promoRes.status === "fulfilled") setPromotions(promoRes.value.data);

        const failed = [];
        if (ordersRes.status === "rejected") failed.push("orders");
        if (reqRes.status === "rejected") failed.push("change requests");
        if (promoRes.status === "rejected") failed.push("promotions");
        if (failed.length) {
            const status = reqRes.reason?.response?.status ?? promoRes.reason?.response?.status ?? ordersRes.reason?.response?.status;
            showAlert(
                `Couldn't load: ${failed.join(", ")}. ` +
                (status === 404
                    ? "These use newer endpoints — rebuild and restart the backend so /api/owner/promotions and /api/owner/my-change-requests are available."
                    : "Please try again."),
                "warning"
            );
        }
    };

    const loadChangeRequests = async () => {
        try {
            const res = await ownerRepository.getMyChangeRequests();
            setChangeRequests(res.data);
        } catch (e) { /* non-fatal */ }
    };

    const loadPromotions = async () => {
        try {
            const res = await ownerRepository.getMyPromotions();
            setPromotions(res.data);
        } catch (e) { /* non-fatal */ }
    };

    const loadProducts = async (restaurantId) => {
        setProductsLoading(true);
        try {
            const res = await ownerRepository.getRestaurantProducts(restaurantId);
            setProducts(res.data);
        } catch (e) {
            showAlert("Failed to load menu: " + (e.response?.data?.message || e.message), "error");
        } finally { setProductsLoading(false); }
    };

    const loadAnalytics = async (restaurantId) => {
        setAnalyticsLoading(true);
        try {
            const res = await ownerRepository.getAnalytics(restaurantId);
            setAnalytics(res.data);
        } catch (e) {
            showAlert("Failed to load analytics", "error");
        } finally { setAnalyticsLoading(false); }
    };

    useEffect(() => {
        if (!selectedRestaurant) return;
        if (tab === 1) loadProducts(selectedRestaurant.id);
        if (tab === 4) loadAnalytics(selectedRestaurant.id);
    }, [selectedRestaurant, tab]);

    const submitRestaurantEdit = async () => {
        try {
            await ownerRepository.submitRestaurantChangeRequest(selectedRestaurant.id, editDialog.payload);
            showAlert("Change request submitted — waiting for admin approval.", "success");
            setEditDialog({ open: false, type: null, payload: {} });
            loadChangeRequests();
        } catch (e) { showAlert("Error: " + (e.response?.data?.message || e.message), "error"); }
    };

    const submitPromotion = async () => {
        try {
            const payload = {
                ...promoData,
                discountPercent: promoData.discountPercent ? Number(promoData.discountPercent) : null,
                discountAmount: promoData.discountAmount ? Number(promoData.discountAmount) : null,
                validFrom: promoData.validFrom ? new Date(promoData.validFrom).toISOString() : null,
                validUntil: promoData.validUntil ? new Date(promoData.validUntil).toISOString() : null,
            };
            await ownerRepository.submitPromotion(selectedRestaurant.id, payload);
            showAlert("Promotion submitted — waiting for admin approval.", "success");
            setPromoDialog({ open: false });
            setPromoData({ promotionName: "", discountPercent: "", discountAmount: "", description: "", validFrom: "", validUntil: "" });
            loadPromotions();
        } catch (e) { showAlert("Error: " + (e.response?.data?.message || e.message), "error"); }
    };

    const handleCsvUpload = async () => {
        if (!csvFile || !selectedRestaurant) return;
        setCsvUploading(true); setCsvResult(null);
        try {
            const res = await ownerRepository.importMenuCsv(selectedRestaurant.id, csvFile);
            setCsvResult(res.data);
            if (res.data.submitted > 0) {
                showAlert(`✅ ${res.data.submitted} product(s) submitted for admin approval!`, "success");
                loadChangeRequests();
            }
        } catch (e) {
            setCsvResult({ error: e.response?.data?.error || e.message });
        } finally { setCsvUploading(false); }
    };

    if (loading) return <Box textAlign="center" pt={8}><CircularProgress sx={{ color: PRIMARY }} /></Box>;
    if (restaurants.length === 0) return (
        <Box p={6} textAlign="center">
            <StorefrontIcon sx={{ fontSize: 72, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No restaurants assigned to your account.</Typography>
        </Box>
    );

    const revenueByMonthData = Object.entries(analytics?.revenueByMonth || {}).map(([m, r]) => ({ month: m.slice(5), revenue: Math.round(r) }));
    const peakHoursData = Object.entries(analytics?.ordersByHour || {}).map(([h, c]) => ({ hour: `${String(h).padStart(2, "0")}:00`, count: Number(c) })).sort((a, b) => b.count - a.count).slice(0, 8);
    const dayOfWeekData = Object.entries(analytics?.ordersByDayOfWeek || {}).map(([day, count]) => ({ day: day.slice(0, 3), count: Number(count) }));
    const topProductsPieData = (analytics?.topProducts || []).map(p => ({ name: p.productName, value: Number(p.quantity) }));
    const filteredProducts = products.filter(p => !menuFilter || p.name?.toLowerCase().includes(menuFilter.toLowerCase()) || p.category?.toLowerCase().includes(menuFilter.toLowerCase()));

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 48, height: 48 }}><StorefrontIcon /></Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Owner Panel</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedRestaurant?.name}</Typography>
                </Box>
                <Box flex={1} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Restaurant</InputLabel>
                    <Select value={selectedRestaurant?.id || ""} label="Restaurant"
                            onChange={(e) => { const r = restaurants.find(r => r.id === e.target.value); setSelectedRestaurant(r); setAnalytics(null); setProducts([]); setCsvResult(null); }}>
                        {restaurants.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Stack>

            {alertMsg && <Alert severity={alertSeverity} onClose={() => setAlertMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{alertMsg}</Alert>}

            {/* Tabs */}
            <Paper sx={{ borderRadius: 2, mb: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                      sx={{ "& .MuiTab-root": { minHeight: 56, fontWeight: 600 }, "& .Mui-selected": { color: PRIMARY }, "& .MuiTabs-indicator": { bgcolor: PRIMARY } }}>
                    <Tab icon={<StorefrontIcon fontSize="small" />} iconPosition="start" label="My Restaurant" />
                    <Tab icon={<RestaurantMenuIcon fontSize="small" />} iconPosition="start" label="Menu" />
                    <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Orders" />
                    <Tab icon={<PendingActionsIcon fontSize="small" />} iconPosition="start" label="Change Requests" />
                    <Tab icon={<AnalyticsIcon fontSize="small" />} iconPosition="start" label="Analytics" />
                    <Tab icon={<UploadFileIcon fontSize="small" />} iconPosition="start" label="Import Menu" />
                    <Tab icon={<LocalOfferIcon fontSize="small" />} iconPosition="start" label="Promotions" />
                </Tabs>
            </Paper>

            {/* TAB 0: Restaurant Info */}
            {tab === 0 && selectedRestaurant && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <SectionCard title="Restaurant Details" icon={<StorefrontIcon fontSize="small" />}
                                     action={<Button size="small" variant="outlined" sx={{ borderColor: PRIMARY, color: PRIMARY, mr: 1 }}
                                                     onClick={() => setEditDialog({ open: true, type: "restaurant", payload: { name: selectedRestaurant.name, description: selectedRestaurant.description, category: selectedRestaurant.category, openHours: selectedRestaurant.openHours } })}>
                                         Request Edit
                                     </Button>}>
                            <Grid container spacing={2}>
                                {[["Name", selectedRestaurant.name], ["Description", selectedRestaurant.description], ["Category", selectedRestaurant.category], ["Open Hours", selectedRestaurant.openHours], ["Status", selectedRestaurant.isOpen ? "✅ Open" : "🔴 Closed"]].map(([label, value]) => (
                                    <Grid item xs={12} sm={6} key={label}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                                        <Typography variant="body1" fontWeight={500}>{value ?? "—"}</Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <SectionCard title="Quick Actions" icon={<LocalOfferIcon fontSize="small" />}>
                            <Stack spacing={2}>
                                <Button fullWidth variant="contained" sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#ea6d0d" } }} onClick={() => setTab(1)}>📋 View & Edit Menu</Button>
                                <Button fullWidth variant="outlined" sx={{ borderColor: PRIMARY, color: PRIMARY }} onClick={() => setTab(5)}>📥 Import Menu from CSV</Button>
                                <Button fullWidth variant="outlined" sx={{ borderColor: SECONDARY, color: SECONDARY }} onClick={() => setPromoDialog({ open: true })}>🏷 Create Promotion</Button>
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" color="text.secondary">
                                Restaurant info changes, menu edits and deletions, and CSV imports all require admin approval before they take effect.
                            </Typography>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {/* TAB 1: Menu */}
            {tab === 1 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader
                        title={<Typography variant="h6" fontWeight={700}>Menu — {selectedRestaurant?.name}</Typography>}
                        subheader="Edit or delete a product to submit a change request. Changes take effect only after an admin approves them."
                        action={
                            <Stack direction="row" spacing={1} mr={1} alignItems="center">
                                <TextField size="small" placeholder="Filter by name or category…" value={menuFilter}
                                           onChange={(e) => setMenuFilter(e.target.value)} sx={{ width: 220 }} />
                                <Button variant="outlined" size="small" sx={{ borderColor: PRIMARY, color: PRIMARY, whiteSpace: "nowrap" }}
                                        onClick={() => setTab(5)}>+ Import CSV</Button>
                            </Stack>
                        }
                    />
                    <CardContent sx={{ p: 0 }}>
                        {productsLoading ? (
                            <Box p={4} textAlign="center"><CircularProgress sx={{ color: PRIMARY }} /></Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                        <TableRow>
                                            {["", "Name", "Description", "Price", "Category", "Image URL", "Qty", "Status", ""].map((h, i) => (
                                                <TableCell key={i} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredProducts.map(p => (
                                            <ProductRow key={p.id} product={p} restaurantId={selectedRestaurant.id}
                                                        onRequested={loadChangeRequests}
                                                        showAlert={showAlert} />
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                                {menuFilter ? "No products match your filter." : "No products yet. Import a CSV or add products via Change Request."}
                                            </TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB 2: Orders */}
            {tab === 2 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader title={<Typography variant="h6" fontWeight={700}>Orders</Typography>}
                                subheader="Click the arrow to expand order items. Customer identities are anonymized." />
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        {["", "Order", "Customer", "Status", "Items", "Total", "Placed At", "Area"].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orders.filter(o => !selectedRestaurant || o.restaurantName === selectedRestaurant.name)
                                        .map(o => <OrderRow key={o.orderId} o={o} />)}
                                    {orders.length === 0 && (
                                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>No orders yet</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* TAB 3: Change Requests */}
            {tab === 3 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader title={<Typography variant="h6" fontWeight={700}>My Change Requests</Typography>} />
                    <CardContent sx={{ p: 0 }}>
                        {changeRequests.length === 0 ? (
                            <Box p={4} textAlign="center">
                                <PendingActionsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                <Typography color="text.secondary">No change requests submitted yet.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                        <TableRow>
                                            {["ID", "Type", "Status", "Submitted", "Reason"].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {changeRequests.map(r => (
                                            <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                                                <TableCell>#{r.id}</TableCell>
                                                <TableCell><Chip label={r.type} size="small" variant="outlined" /></TableCell>
                                                <TableCell><Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || "default"} /></TableCell>
                                                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</TableCell>
                                                <TableCell sx={{ color: "error.main", fontSize: 13 }}>{r.rejectionReason || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB 4: Analytics */}
            {tab === 4 && (
                analyticsLoading ? <Box textAlign="center" pt={8}><CircularProgress sx={{ color: PRIMARY }} /></Box>
                    : analytics ? (
                        <Grid container spacing={3}>
                            <Grid item xs={6} sm={3}><StatCard icon={<ShoppingCartIcon />} label="Total Orders" value={analytics.totalOrders} color={PRIMARY} /></Grid>
                            <Grid item xs={6} sm={3}><StatCard icon={<AttachMoneyIcon />} label="Revenue (МКД)" value={analytics.totalRevenue?.toLocaleString("mk-MK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} color="#10b981" sub="from delivered orders" /></Grid>
                            <Grid item xs={6} sm={3}><StatCard icon={<TrendingUpIcon />} label="Avg Order (МКД)" value={analytics.averageOrderValue?.toFixed(0)} color={SECONDARY} sub="delivered orders only" /></Grid>
                            <Grid item xs={6} sm={3}><StatCard icon={<CancelIcon />} label="Cancelled" value={analytics.cancelledOrders} color="#ef4444" /></Grid>

                            {analytics.totalRevenue === 0 && (
                                <Grid item xs={12}>
                                    <Alert severity="info">Revenue shows 0 because no orders have reached <strong>DELIVERED</strong> status yet. Mark orders as delivered in pgAdmin or via the courier flow to see revenue data.</Alert>
                                </Grid>
                            )}

                            <Grid item xs={12} md={7}>
                                <SectionCard title="Revenue by Month (МКД)" icon={<TrendingUpIcon fontSize="small" />}>
                                    {revenueByMonthData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={revenueByMonthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <RTooltip formatter={(v) => [`${v} МКД`, "Revenue"]} />
                                                <Line type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} dot={{ fill: PRIMARY, r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Box textAlign="center" py={4} color="text.secondary">
                                            <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                                            <Typography variant="body2">No delivered orders yet</Typography>
                                        </Box>
                                    )}
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <SectionCard title="Top Products" icon={<EmojiEventsIcon fontSize="small" />}>
                                    {topProductsPieData.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <PieChart>
                                                    <Pie data={topProductsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                                                         label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                                                        {topProductsPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                    </Pie>
                                                    <RTooltip formatter={(v, name) => [v + " sold", name]} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <Box mt={1}>
                                                {analytics.topProducts?.map((p, i) => (
                                                    <Stack key={p.productId} direction="row" justifyContent="space-between" alignItems="center" py={0.4}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                            <Typography variant="body2">{i + 1}. {p.productName}</Typography>
                                                        </Stack>
                                                        <Typography variant="body2" color="text.secondary">{p.quantity} × · {p.revenue?.toFixed(0)} МКД</Typography>
                                                    </Stack>
                                                ))}
                                            </Box>
                                        </>
                                    ) : <Box textAlign="center" py={4} color="text.secondary"><Typography variant="body2">No sales data yet</Typography></Box>}
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} md={7}>
                                <SectionCard title="Orders by Day of Week" icon={<CalendarMonthIcon fontSize="small" />}>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={dayOfWeekData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                            <RTooltip formatter={(v) => [v, "Orders"]} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {dayOfWeekData.map((d, i) => <Cell key={i} fill={d.count === Math.max(...dayOfWeekData.map(x => x.count)) ? PRIMARY : SECONDARY} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <SectionCard title="Peak Ordering Hours" icon={<AccessTimeIcon fontSize="small" />}>
                                    {peakHoursData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={peakHoursData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                                <YAxis type="category" dataKey="hour" tick={{ fontSize: 11 }} width={46} />
                                                <RTooltip formatter={(v) => [v, "Orders"]} />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {peakHoursData.map((_, i) => <Cell key={i} fill={i === 0 ? PRIMARY : `${PRIMARY}${Math.round(255 * (1 - i * 0.1)).toString(16).padStart(2, "0")}`} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <Box textAlign="center" py={4} color="text.secondary"><AccessTimeIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><Typography variant="body2">No orders yet</Typography></Box>}
                                </SectionCard>
                            </Grid>
                        </Grid>
                    ) : <Box textAlign="center" pt={8} color="text.secondary"><AnalyticsIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} /><Typography>Loading analytics…</Typography></Box>
            )}

            {/* TAB 5: Import Menu */}
            {tab === 5 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                            <CardHeader title={<Typography variant="h6" fontWeight={700}>Import Menu from CSV</Typography>}
                                        subheader={`Rows are submitted as product-add requests for ${selectedRestaurant?.name} — admin approval required`} />
                            <CardContent>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Each row is submitted as a <strong>product-add change request</strong>. Items appear to
                                    customers only after an admin approves them in the Owner Requests panel.
                                    Include an <code>imageUrl</code> column with a public image link to show product photos.
                                </Alert>
                                <Box onClick={() => fileInputRef.current?.click()}
                                     sx={{ border: `2px dashed ${csvFile ? PRIMARY : "#cbd5e1"}`, borderRadius: 2, p: 4, textAlign: "center", cursor: "pointer",
                                         bgcolor: csvFile ? PRIMARY + "08" : "#f8fafc", transition: "all 0.2s", "&:hover": { borderColor: PRIMARY, bgcolor: PRIMARY + "08" } }}>
                                    <UploadFileIcon sx={{ fontSize: 48, color: csvFile ? PRIMARY : "text.disabled", mb: 1 }} />
                                    {csvFile ? (
                                        <><Typography fontWeight={600} color={PRIMARY}>{csvFile.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{(csvFile.size / 1024).toFixed(1)} KB · Click to change</Typography></>
                                    ) : (
                                        <><Typography fontWeight={600}>Click to select a CSV file</Typography>
                                            <Typography variant="caption" color="text.secondary">or drag and drop</Typography></>
                                    )}
                                    <input ref={fileInputRef} type="file" accept=".csv" hidden
                                           onChange={(e) => { setCsvFile(e.target.files[0] || null); setCsvResult(null); }} />
                                </Box>
                                <Stack direction="row" spacing={2} mt={3}>
                                    <Button fullWidth variant="contained" disabled={!csvFile || csvUploading}
                                            sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#ea6d0d" } }} onClick={handleCsvUpload}>
                                        {csvUploading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Upload & Import"}
                                    </Button>
                                    <Button fullWidth variant="outlined" startIcon={<DownloadIcon />}
                                            sx={{ borderColor: SECONDARY, color: SECONDARY }} onClick={downloadTemplate}>
                                        Download Template
                                    </Button>
                                </Stack>
                                {csvUploading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
                                {csvResult && !csvResult.error && (
                                    <Box mt={3}>
                                        <Stack direction="row" spacing={2} mb={2}>
                                            <Chip icon={<CheckCircleIcon />} label={`${csvResult.submitted} submitted for approval`} color="success" />
                                            {csvResult.errors > 0 && <Chip icon={<ErrorIcon />} label={`${csvResult.errors} skipped`} color="warning" />}
                                        </Stack>
                                        {csvResult.submittedProducts?.length > 0 && (
                                            <Box sx={{ maxHeight: 200, overflowY: "auto", bgcolor: "#f8fafc", borderRadius: 1, p: 1.5 }}>
                                                {csvResult.submittedProducts.map((name, i) => (
                                                    <Stack key={i} direction="row" alignItems="center" spacing={1} py={0.3}>
                                                        <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
                                                        <Typography variant="body2">{name}</Typography>
                                                    </Stack>
                                                ))}
                                            </Box>
                                        )}
                                        {csvResult.errorDetails?.length > 0 && (
                                            <Box mt={1} sx={{ maxHeight: 120, overflowY: "auto", bgcolor: "#fff5f5", borderRadius: 1, p: 1.5 }}>
                                                {csvResult.errorDetails.map((err, i) => (
                                                    <Stack key={i} direction="row" alignItems="center" spacing={1} py={0.3}>
                                                        <ErrorIcon sx={{ fontSize: 14, color: "error.main" }} />
                                                        <Typography variant="body2" color="error.main">{err}</Typography>
                                                    </Stack>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                                {csvResult?.error && <Alert severity="error" sx={{ mt: 2 }}>{csvResult.error}</Alert>}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                            <CardHeader title={<Typography variant="h6" fontWeight={700}>CSV Format</Typography>} />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    First row must be a header. Column order doesn't matter — matched by name.
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Column</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                ["name", "✅ Yes", "Product name"],
                                                ["price", "✅ Yes", "Number, e.g. 350"],
                                                ["description", "No", "Short description"],
                                                ["category", "No", "e.g. Pizza, Drinks"],
                                                ["imageUrl", "No", "Full public URL to image"],
                                                ["quantity", "No", "Defaults to 100"],
                                            ].map(([col, req, note]) => (
                                                <TableRow key={col}>
                                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{col}</TableCell>
                                                    <TableCell>{req}</TableCell>
                                                    <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{note}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Box mt={3} sx={{ bgcolor: "#f8fafc", borderRadius: 1, p: 2, fontFamily: "monospace", fontSize: 12, color: "text.secondary", overflowX: "auto", whiteSpace: "pre" }}>
                                    {`name,description,price,category,imageUrl,quantity
Margherita Pizza,Classic tomato,450,Pizza,https://i.imgur.com/abc.jpg,100
Caesar Salad,Romaine lettuce,320,Salads,,100
Coca Cola,330ml,80,Drinks,,200`}
                                </Box>
                                <Button size="small" startIcon={<DownloadIcon />} onClick={downloadTemplate} sx={{ mt: 1.5, color: SECONDARY }}>
                                    Download this template
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* TAB 6: Promotions */}
            {tab === 6 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader title={<Typography variant="h6" fontWeight={700}>Promotions & Discounts</Typography>}
                                subheader="All promotions require admin approval before customers see them"
                                action={<Button variant="contained" sx={{ bgcolor: PRIMARY, mr: 1 }} onClick={() => setPromoDialog({ open: true })}>+ New Promotion</Button>} />
                    <CardContent sx={{ pt: 0 }}>
                        <Box sx={{ p: 2, mb: 2, bgcolor: "#fff7ed", borderRadius: 2, border: "1px solid #fed7aa" }}>
                            <Typography variant="body2" color="#92400e">
                                💡 Promotions can be a fixed МКД discount or a percentage off. Once approved, customers see it at checkout.
                            </Typography>
                        </Box>
                        {promotions.length === 0 ? (
                            <Box p={4} textAlign="center">
                                <LocalOfferIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                <Typography color="text.secondary">No promotions submitted yet.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                        <TableRow>
                                            {["Name", "Restaurant", "Discount", "Status", "Active", "Submitted", "Reason"].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {promotions.map(p => (
                                            <TableRow key={p.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                                                <TableCell>
                                                    <Stack>
                                                        <Typography fontWeight={600}>{p.promotionName || "—"}</Typography>
                                                        {p.description && <Typography variant="caption" color="text.secondary">{p.description}</Typography>}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ color: "text.secondary" }}>{p.restaurantName || `#${p.restaurantId}`}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" sx={{ bgcolor: "#fff7ed", color: PRIMARY, fontWeight: 700 }}
                                                          label={p.discountPercent ? `${p.discountPercent}%` : p.discountAmount ? `${p.discountAmount} МКД` : "—"} />
                                                </TableCell>
                                                <TableCell><Chip label={p.status} size="small" color={STATUS_COLORS[p.status] || "default"} /></TableCell>
                                                <TableCell>{p.active ? <Chip label="Live" size="small" color="success" /> : <Chip label="No" size="small" variant="outlined" />}</TableCell>
                                                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</TableCell>
                                                <TableCell sx={{ color: "error.main", fontSize: 13 }}>{p.rejectionReason || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: null, payload: {} })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Request Restaurant Update</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>Changes go live only after admin approval.</Alert>
                    {Object.entries(editDialog.payload).map(([key, value]) => (
                        <TextField key={key} fullWidth label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                                   value={value} onChange={(e) => setEditDialog(prev => ({ ...prev, payload: { ...prev.payload, [key]: e.target.value } }))}
                                   sx={{ mb: 2 }} />
                    ))}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEditDialog({ open: false, type: null, payload: {} })}>Cancel</Button>
                    <Button variant="contained" sx={{ bgcolor: PRIMARY }} onClick={submitRestaurantEdit}>Submit Request</Button>
                </DialogActions>
            </Dialog>

            {/* Promotion Dialog */}
            <Dialog open={promoDialog.open} onClose={() => setPromoDialog({ open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Promotion Request</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>Promotions require admin approval.</Alert>
                    {[{ key: "promotionName", label: "Promotion Name" }, { key: "description", label: "Description" },
                        { key: "discountPercent", label: "Discount %", type: "number" }, { key: "discountAmount", label: "Fixed Discount (МКД)", type: "number" },
                        { key: "validFrom", label: "Valid From", type: "datetime-local" }, { key: "validUntil", label: "Valid Until", type: "datetime-local" }
                    ].map(({ key, label, type }) => (
                        <TextField key={key} fullWidth label={label} value={promoData[key]}
                                   onChange={(e) => setPromoData(prev => ({ ...prev, [key]: e.target.value }))}
                                   sx={{ mb: 2 }} type={type || "text"} InputLabelProps={type === "datetime-local" ? { shrink: true } : undefined} />
                    ))}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPromoDialog({ open: false })}>Cancel</Button>
                    <Button variant="contained" sx={{ bgcolor: PRIMARY }} onClick={submitPromotion}>Submit</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OwnerDashboard;
