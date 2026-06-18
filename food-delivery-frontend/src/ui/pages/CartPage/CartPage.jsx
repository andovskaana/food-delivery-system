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
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Alert from "../../../common/Alert.jsx";
import crossSellRepository from "../../../repository/crossSellRepository.js";
import productRepository from "../../../repository/productRepository.js";
import FreeDeliveryBanner from "../../components/promotions/FreeDeliveryBanner.jsx";



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
    const [address, setAddress] = useState({
        line1: "",
        line2: "",
        city: "",
        postalCode: "",
        country: "",
    });

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [crossSell, setCrossSell] = useState([]);
    const [crossSellLoading, setCrossSellLoading] = useState(false);


    const onCheckout = () => {
        if (!order?.deliveryAddress) {
            setShowAddressDialog(true);
            return;
        }
        navigate("/checkout");
    };

    const onCancel = () => {
        setConfirmOpen(true);
    };

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

    useEffect(() => {
        if (!order?.products || order.products.length === 0) {
            setCrossSell([]);
            return;
        }

        const productIds = order.products.map((p) => p.id);

        setCrossSellLoading(true);

        crossSellRepository
            .getCrossSellRecommendations(productIds, 5)
            .then((res) => {
                setCrossSell(res.data);
            })
            .catch(() => {
                setCrossSell([]);
            })
            .finally(() => {
                setCrossSellLoading(false);
            });
    }, [order]);

    // Calculate cart total for free delivery banner
    const cartTotal = useMemo(() => {
        if (!order?.products) return 0;
        return order.products.reduce((sum, p) => sum + (p.price || 0), 0);
    }, [order]);

    if (loading) return <>Loading...</>;

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, px: 2 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Your Cart
                </Typography>
            </Box>

            {/* Free Delivery Progress Banner */}
            {order && order.products && order.products.length > 0 && (
                <FreeDeliveryBanner cartTotal={cartTotal} />
            )}

            {/* Order list */}
            <OrderList order={order} onCheckout={onCheckout} onCancel={onCancel} refresh={refresh} />

            {/* Cross-sell recommendations */}
            {!crossSellLoading && crossSell.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Frequently bought together
                    </Typography>

                    {/*<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>*/}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: 2,
                            width: "100%",
                        }}
                    >

                    {crossSell.map((p) => (
                            <Box
                                key={p.id}
                                sx={{
                                    border: "1px solid #ddd",
                                    borderRadius: 2,
                                    p: 2,
                                    width: 180,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    style={{
                                        width: "100%",
                                        height: 100,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        marginBottom: 8,
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />

                                <Typography fontWeight={600} align="center">
                                    {p.name}
                                </Typography>

                                <Typography variant="body2">{p.price} ден.</Typography>

                                <Button
                                    size="small"
                                    sx={{ mt: 1 }}
                                    variant="outlined"
                                    onClick={async () => {
                                        await productRepository.addToOrder(p.id);
                                        await refresh();
                                    }}
                                >
                                    Add to cart
                                </Button>
                            </Box>

                        ))}
                    </Box>
                </Box>
            )}


            {/* Address Dialog */}
            <Dialog open={showAddressDialog} onClose={() => setShowAddressDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Enter Delivery Address</DialogTitle>
                <Divider />
                <DialogContent sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide your delivery details so we can bring your order right to your door.
                    </Typography>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Address Line 1"
                        value={address.line1}
                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Address Line 2"
                        value={address.line2}
                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="City"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Postal Code"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Country"
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowAddressDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveAddress} sx={{ borderRadius: 2 }}>
                        Save & Continue
                    </Button>
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