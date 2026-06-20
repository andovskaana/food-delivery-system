import React, { useState, useEffect, useMemo } from "react";
import useOrder from "../../../hooks/useOrder.js";
import OrderList from "../../components/order/OrderList/OrderList.jsx";
import orderRepository from "../../../repository/orderRepository.js";
import { useNavigate } from "react-router";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Divider,
    Alert as MuiAlert,
    Card,
    CardContent,
    Stack,
    Chip,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Alert from "../../../common/Alert.jsx";
import crossSellRepository from "../../../repository/crossSellRepository.js";
import productRepository from "../../../repository/productRepository.js";
import FreeDeliveryBanner from "../../components/promotions/FreeDeliveryBanner.jsx";
import groupOrderRepository from "../../../repository/groupOrderRepository.js";

function ConfirmPopup({ open, message, onCancel, onConfirm }) {
    if (!open) return null;
    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                p: 2,
            }}
        >
            <Box
                sx={{
                    bgcolor: "white",
                    borderRadius: 3,
                    p: 3,
                    width: "90%",
                    maxWidth: 420,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    textAlign: "center",
                }}
            >
                <Typography sx={{ mb: 2 }}>{message}</Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={onConfirm}>
                        Confirm
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

const CartPage = () => {
    const { order, loading, refresh } = useOrder();
    const navigate = useNavigate();

    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [address, setAddress] = useState({ line1: "", line2: "", city: "", postalCode: "", country: "" });
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [crossSell, setCrossSell] = useState([]);
    const [crossSellLoading, setCrossSellLoading] = useState(false);
    const [activeGroups, setActiveGroups] = useState([]);

    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [splitCount, setSplitCount] = useState(2);
    const [splitType, setSplitType] = useState("EQUAL");
    const [splitError, setSplitError] = useState("");
    const [creatingGroup, setCreatingGroup] = useState(false);

    const hasCartItems = Boolean((order?.products?.length ?? 0) > 0 || (order?.items?.length ?? 0) > 0);

    const fetchActiveGroups = async () => {
        try {
            const res = await groupOrderRepository.getMyActiveGroups();
            setActiveGroups(res.data || []);
        } catch (_) {
            setActiveGroups([]);
        }
    };

    useEffect(() => {
        fetchActiveGroups();
    }, []);

    const onCheckout = () => {
        if (!order?.deliveryAddress) {
            setShowAddressDialog(true);
            return;
        }
        navigate("/checkout");
    };

    const onCancel = () => setConfirmOpen(true);

    const handleSaveAddress = async () => {
        if (!address.line1 || !address.city || !address.country) {
            setAlertMessage("Please fill in Line 1, City, and Country.");
            setAlertOpen(true);
            return;
        }
        await orderRepository.updateAddress(order.id, address);
        await refresh();
        setShowAddressDialog(false);
        navigate("/checkout");
    };

    const openSplitDialog = (type) => {
        setSplitType(type);
        setSplitError("");
        setSplitDialogOpen(true);
    };

    const createSplitOrder = async () => {
        const count = Number(splitCount);
        if (!count || count < 2) {
            setSplitError("Split count must be at least 2");
            return;
        }
        if (count > 10) {
            setSplitError("Split count cannot be greater than 10");
            return;
        }
        setCreatingGroup(true);
        setSplitError("");
        try {
            const res = await groupOrderRepository.createGroupOrder(count, splitType);
            const groupCode = res?.data?.groupCode;
            if (!groupCode) {
                setSplitError("Group order was created but the code was not returned.");
                return;
            }
            setSplitDialogOpen(false);
            await refresh();
            await fetchActiveGroups();
            navigate(`/group-orders/${groupCode}`);
        } catch (e) {
            setSplitError(e?.response?.data?.message || e?.response?.data || "Failed to create group order");
        } finally {
            setCreatingGroup(false);
        }
    };

    useEffect(() => {
        if (!order?.products || order.products.length === 0) {
            setCrossSell([]);
            return;
        }
        const productIds = order.products.map((p) => p.id);
        setCrossSellLoading(true);
        crossSellRepository
            .getCrossSellRecommendations(productIds, 5)
            .then((res) => setCrossSell(res.data))
            .catch(() => setCrossSell([]))
            .finally(() => setCrossSellLoading(false));
    }, [order]);

    const cartTotal = useMemo(() => {
        if (Number(order?.subtotal) > 0) return Number(order.subtotal);
        if (order?.products?.length) return order.products.reduce((sum, p) => sum + (p.price || 0), 0);
        if (order?.items?.length) return order.items.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0);
        return 0;
    }, [order]);

    if (loading) return <>Loading...</>;

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, px: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Your Cart</Typography>
            </Box>

            {activeGroups.length > 0 && (
                <MuiAlert severity="info" sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>You have active group orders</Typography>
                    <Stack spacing={1}>
                        {activeGroups.map((group) => (
                            <Card key={group.groupCode} variant="outlined">
                                <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                                        <Box>
                                            <Typography sx={{ fontWeight: 700 }}>
                                                Code {group.groupCode} · {Number(group.totalAmount || 0).toFixed(2)} ден.
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {group.splitType === "ITEMS" ? "Split by items" : "Equal split"} · {group.joinedParticipantsCount}/{group.splitCount} joined · {group.status}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip size="small" label={group.status} />
                                            <Button size="small" variant="contained" onClick={() => navigate(`/group-orders/${group.groupCode}`)}>
                                                Open
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                    <Button sx={{ mt: 1 }} size="small" onClick={() => navigate("/group-orders/my-groups")}>View group history</Button>
                </MuiAlert>
            )}

            {hasCartItems && <FreeDeliveryBanner cartTotal={cartTotal} />}

            <OrderList order={order} onCheckout={onCheckout} onCancel={onCancel} refresh={refresh} />

            {hasCartItems && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" onClick={() => openSplitDialog("EQUAL")}>Split equally</Button>
                    <Button variant="outlined" onClick={() => openSplitDialog("ITEMS")}>Split by items</Button>
                </Box>
            )}

            {!crossSellLoading && crossSell.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Frequently bought together</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2, width: "100%" }}>
                        {crossSell.map((p) => (
                            <Box key={p.id} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, width: 180, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                                <Typography fontWeight={600} align="center">{p.name}</Typography>
                                <Typography variant="body2">{p.price} ден.</Typography>
                                <Button
                                    size="small"
                                    sx={{ mt: 1 }}
                                    variant="outlined"
                                    onClick={async () => { await productRepository.addToOrder(p.id); await refresh(); }}
                                >
                                    Add to cart
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            <Dialog open={showAddressDialog} onClose={() => setShowAddressDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Enter Delivery Address</DialogTitle>
                <Divider />
                <DialogContent sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide your delivery details so we can bring your order right to your door.
                    </Typography>
                    <TextField fullWidth margin="normal" label="Address Line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                    <TextField fullWidth margin="normal" label="Address Line 2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                    <TextField fullWidth margin="normal" label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                    <TextField fullWidth margin="normal" label="Postal Code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
                    <TextField fullWidth margin="normal" label="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowAddressDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveAddress} sx={{ borderRadius: 2 }}>Save & Continue</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={splitDialogOpen} onClose={() => setSplitDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {splitType === "ITEMS" ? "Split the Bill by Items" : "Split the Bill Equally"}
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {splitType === "ITEMS"
                            ? "Enter how many participant slots to open. Each participant will choose the exact items they pay for."
                            : "Enter how many people will split this order. The creator is included as the first participant."}
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        label="Number of Participants"
                        value={splitCount}
                        onChange={(e) => { const value = e.target.value; setSplitCount(value === "" ? "" : Number(value)); setSplitError(""); }}
                        inputProps={{ min: 2, max: 10 }}
                        error={!!splitError}
                        helperText={splitError}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSplitDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={createSplitOrder} disabled={creatingGroup} sx={{ borderRadius: 2 }}>Create</Button>
                </DialogActions>
            </Dialog>

            <ConfirmPopup
                open={confirmOpen}
                message="Remove all items from the cart?"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => {
                    await orderRepository.cancelPending();
                    await refresh();
                    setConfirmOpen(false);
                    setAlertMessage("Cart cleared.");
                    setAlertOpen(true);
                }}
            />

            <Alert open={alertOpen} onClose={() => setAlertOpen(false)} message={alertMessage} />
        </Box>
    );
};

export default CartPage;
