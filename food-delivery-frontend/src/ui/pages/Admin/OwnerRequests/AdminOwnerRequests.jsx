import React, { useEffect, useState } from "react";
import {
    Box, Typography, Card, CardHeader, CardContent, Stack, Avatar, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Alert, CircularProgress, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EditNoteIcon from "@mui/icons-material/EditNote";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { ownerRepository } from "../../../../repository/ownerRepository.js";

const PRIMARY = "#f97316";
const SECONDARY = "#2563eb";

const TYPE_LABELS = {
    RESTAURANT_UPDATE: "Restaurant update",
    PRODUCT_ADD: "Add product",
    PRODUCT_UPDATE: "Edit product",
    PRODUCT_DELETE: "Delete product",
};

const TYPE_COLORS = {
    RESTAURANT_UPDATE: "info",
    PRODUCT_ADD: "success",
    PRODUCT_UPDATE: "warning",
    PRODUCT_DELETE: "error",
};

/** Renders the JSON payload of a change request as readable key/value chips. */
const PayloadView = ({ payload }) => {
    let parsed = null;
    try {
        parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    } catch {
        return <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{payload}</Typography>;
    }
    if (!parsed || typeof parsed !== "object") {
        return <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{String(payload)}</Typography>;
    }
    return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {Object.entries(parsed).map(([k, v]) => (
                <Chip key={k} size="small" variant="outlined"
                      label={`${k}: ${v === null || v === "" ? "—" : v}`}
                      sx={{ fontFamily: "monospace", fontSize: 11, mb: 0.5 }} />
            ))}
        </Stack>
    );
};

const formatDate = (d) => (d ? new Date(d).toLocaleString() : "—");

const AdminOwnerRequests = () => {
    const [tab, setTab] = useState(0);
    const [changes, setChanges] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("info");
    // rejectDialog: { open, kind: "change"|"promotion", id, reason }
    const [rejectDialog, setRejectDialog] = useState({ open: false, kind: null, id: null, reason: "" });

    const showAlert = (msg, sev = "info") => { setAlertMsg(msg); setAlertSeverity(sev); };

    const loadAll = async () => {
        try {
            const [changeRes, promoRes] = await Promise.all([
                ownerRepository.getPendingChanges(),
                ownerRepository.getPendingPromotions(),
            ]);
            setChanges(changeRes.data);
            setPromotions(promoRes.data);
        } catch (e) {
            showAlert("Failed to load requests: " + (e.response?.data?.message || e.message), "error");
        }
    };

    useEffect(() => {
        loadAll().finally(() => setLoading(false));
    }, []);

    const approveChange = async (id) => {
        setBusyId("c" + id);
        try {
            await ownerRepository.approveChange(id);
            showAlert("Change request approved and applied.", "success");
            await loadAll();
        } catch (e) {
            showAlert("Approval failed: " + (e.response?.data?.message || e.message), "error");
        } finally { setBusyId(null); }
    };

    const approvePromotion = async (id) => {
        setBusyId("p" + id);
        try {
            await ownerRepository.approvePromotion(id);
            showAlert("Promotion approved and activated.", "success");
            await loadAll();
        } catch (e) {
            showAlert("Approval failed: " + (e.response?.data?.message || e.message), "error");
        } finally { setBusyId(null); }
    };

    const openReject = (kind, id) => setRejectDialog({ open: true, kind, id, reason: "" });
    const closeReject = () => setRejectDialog({ open: false, kind: null, id: null, reason: "" });

    const confirmReject = async () => {
        const { kind, id, reason } = rejectDialog;
        setBusyId((kind === "change" ? "c" : "p") + id);
        try {
            if (kind === "change") await ownerRepository.rejectChange(id, reason);
            else await ownerRepository.rejectPromotion(id, reason);
            showAlert("Request rejected. Original data left unchanged.", "info");
            closeReject();
            await loadAll();
        } catch (e) {
            showAlert("Rejection failed: " + (e.response?.data?.message || e.message), "error");
        } finally { setBusyId(null); }
    };

    const discountLabel = (p) => {
        if (p.discountPercent != null && p.discountPercent > 0) return `${p.discountPercent}%`;
        if (p.discountAmount != null && p.discountAmount > 0) return `${p.discountAmount} МКД`;
        return "—";
    };

    if (loading) return <Box textAlign="center" pt={8}><CircularProgress sx={{ color: PRIMARY }} /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 48, height: 48 }}><AdminPanelSettingsIcon /></Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Owner Requests</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Review and approve change & promotion requests submitted by restaurant owners
                    </Typography>
                </Box>
                <Box flex={1} />
                <Stack direction="row" spacing={1}>
                    <Badge badgeContent={changes.length} color="error">
                        <Button variant={tab === 0 ? "contained" : "outlined"} startIcon={<EditNoteIcon />}
                                onClick={() => setTab(0)}
                                sx={tab === 0 ? { bgcolor: PRIMARY } : { borderColor: PRIMARY, color: PRIMARY }}>
                            Change Requests
                        </Button>
                    </Badge>
                    <Badge badgeContent={promotions.length} color="error">
                        <Button variant={tab === 1 ? "contained" : "outlined"} startIcon={<LocalOfferIcon />}
                                onClick={() => setTab(1)}
                                sx={tab === 1 ? { bgcolor: PRIMARY } : { borderColor: PRIMARY, color: PRIMARY }}>
                            Promotions
                        </Button>
                    </Badge>
                </Stack>
            </Stack>

            {alertMsg && <Alert severity={alertSeverity} onClose={() => setAlertMsg(null)} sx={{ mb: 2 }}>{alertMsg}</Alert>}

            {tab === 0 && (
                <Card sx={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderRadius: 2 }}>
                    <CardHeader
                        title={<Typography variant="h6" fontWeight={700}>Pending Change Requests</Typography>}
                        subheader="Submitted changes stay in PENDING and are not applied to production data until approved. Approving applies them automatically; rejecting leaves the original data unchanged." />
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        {["Type", "Restaurant", "Requested By", "Proposed Changes", "Submitted", "Actions"].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "text.secondary", letterSpacing: 0.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {changes.map(r => (
                                        <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                                            <TableCell>
                                                <Chip label={TYPE_LABELS[r.type] || r.type} size="small"
                                                      color={TYPE_COLORS[r.type] || "default"} />
                                            </TableCell>
                                            <TableCell><Typography fontWeight={600}>{r.restaurantName || `#${r.restaurantId}`}</Typography></TableCell>
                                            <TableCell><Chip label={`@${r.requesterUsername}`} size="small" sx={{ fontFamily: "monospace", bgcolor: "#f1f5f9" }} /></TableCell>
                                            <TableCell sx={{ maxWidth: 320 }}><PayloadView payload={r.payload} /></TableCell>
                                            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{formatDate(r.createdAt)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="contained" color="success"
                                                            startIcon={<CheckCircleIcon />}
                                                            disabled={busyId === "c" + r.id}
                                                            onClick={() => approveChange(r.id)}>Approve</Button>
                                                    <Button size="small" variant="outlined" color="error"
                                                            startIcon={<CancelIcon />}
                                                            disabled={busyId === "c" + r.id}
                                                            onClick={() => openReject("change", r.id)}>Reject</Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {changes.length === 0 && (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                            No pending change requests.
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
                        title={<Typography variant="h6" fontWeight={700}>Pending Promotion Requests</Typography>}
                        subheader="Approving a promotion activates it so customers can see it. Rejecting keeps it inactive." />
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        {["Promotion", "Restaurant", "Product", "Discount", "Requested By", "Submitted", "Actions"].map(h => (
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
                                            <TableCell>{p.restaurantName || `#${p.restaurantId}`}</TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>{p.productName || "All products"}</TableCell>
                                            <TableCell><Chip label={discountLabel(p)} size="small" sx={{ bgcolor: "#fff7ed", color: PRIMARY, fontWeight: 700 }} /></TableCell>
                                            <TableCell><Chip label={`@${p.requesterUsername}`} size="small" sx={{ fontFamily: "monospace", bgcolor: "#f1f5f9" }} /></TableCell>
                                            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{formatDate(p.createdAt)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="contained" color="success"
                                                            startIcon={<CheckCircleIcon />}
                                                            disabled={busyId === "p" + p.id}
                                                            onClick={() => approvePromotion(p.id)}>Approve</Button>
                                                    <Button size="small" variant="outlined" color="error"
                                                            startIcon={<CancelIcon />}
                                                            disabled={busyId === "p" + p.id}
                                                            onClick={() => openReject("promotion", p.id)}>Reject</Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {promotions.length === 0 && (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                            No pending promotion requests.
                                        </TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            <Dialog open={rejectDialog.open} onClose={closeReject} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Reject request</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        The request will be marked REJECTED and the original data will be left unchanged.
                    </Alert>
                    <TextField label="Reason (optional)" fullWidth multiline minRows={2}
                               value={rejectDialog.reason}
                               onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeReject}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmReject}>Reject</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminOwnerRequests;
