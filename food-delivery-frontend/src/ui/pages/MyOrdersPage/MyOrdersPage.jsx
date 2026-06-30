// src/ui/pages/MyOrdersPage/MyOrdersPage.jsx
//
// Shows the customer's active orders (GET /orders/my-orders) AND their past
// delivered orders (GET /orders/history), and lets the customer rate the courier
// after a delivery is complete.
//
// Why history is loaded here:
//   /orders/my-orders returns only ACTIVE statuses (CONFIRMED, PICKED_UP, …);
//   DELIVERED orders come from /orders/history. Rating is only possible once an
//   order is DELIVERED, so both lists are merged so delivered orders are visible
//   and ratable in one place.
//
// Notes:
//   - OrderDto.status is the raw enum name, so comparisons use UPPERCASE
//     ("DELIVERED", "PENDING", …).
//   - OrderDto already carries courierName, courierRated and courierRating
//     (populated server-side), so the UI can show the existing rating or an
//     interactive control as appropriate.

import React, { useEffect, useState } from "react";
import orderRepository from "../../../repository/orderRepository.js";
import courierRepository from "../../../repository/courierRepository.js";
import { useNavigate } from "react-router";
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Divider,
    Alert,
    Rating,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

// Self-contained error extractor (no external dependency).
function extractError(e, fallback) {
    const d = e?.response?.data;
    if (typeof d === "string" && d.trim()) return d;
    if (d?.message) return d.message;
    if (d?.error) return d.error;
    return e?.message || fallback;
}

const statusColor = (status) =>
    status === "DELIVERED"
        ? "success.main"
        : status === "PENDING"
            ? "warning.main"
            : status === "CANCELED"
                ? "error.main"
                : "primary.main";

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // orderId -> draft star value chosen before submitting
    const [drafts, setDrafts] = useState({});
    // orderId currently being submitted
    const [submittingId, setSubmittingId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        // Load active orders and delivered history in parallel; a failure of one
        // must not blank out the other.
        Promise.allSettled([
            orderRepository.getMyOrders(),
            orderRepository.getOrderHistory(),
        ])
            .then(([activeRes, historyRes]) => {
                if (!active) return;

                const activeOrders =
                    activeRes.status === "fulfilled" && Array.isArray(activeRes.value.data)
                        ? activeRes.value.data
                        : [];
                const historyOrders =
                    historyRes.status === "fulfilled" && Array.isArray(historyRes.value.data)
                        ? historyRes.value.data
                        : [];

                // Active first, then delivered history. The two sets are disjoint
                // (history is DELIVERED-only, my-orders excludes DELIVERED).
                setOrders([...activeOrders, ...historyOrders]);

                if (activeRes.status === "rejected" && historyRes.status === "rejected") {
                    setError(extractError(activeRes.reason, "Failed to load your orders."));
                } else {
                    setError("");
                }
            })
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    const submitRating = async (order) => {
        const value = drafts[order.id];
        if (!value) return;
        setSubmittingId(order.id);
        try {
            await courierRepository.rateCourier(order.id, value);
            // Reflect the new rating locally without a refetch.
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === order.id
                        ? { ...o, courierRated: true, courierRating: value }
                        : o
                )
            );
            setError("");
        } catch (e) {
            setError(extractError(e, "Failed to submit rating."));
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    My Orders
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Typography color="text.secondary">Loading…</Typography>
            ) : orders.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                    You don’t have any orders yet.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {orders.map((order) => {
                        const isDelivered = order.status === "DELIVERED";
                        const canRate = isDelivered && order.courierName;
                        return (
                            <Grid item xs={12} sm={6} md={4} key={order.id}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        height: "100%",
                                        borderRadius: 2,
                                        boxShadow:
                                            "0 2px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                            Order #{order.id}
                                        </Typography>
                                        <Divider sx={{ mb: 1.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Restaurant: <strong>{order.restaurantName ?? "—"}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total:{" "}
                                            <strong>
                                                {Number(order.total ?? 0).toFixed(2)} ден.
                                            </strong>
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 1,
                                                fontWeight: 600,
                                                color: statusColor(order.status),
                                            }}
                                        >
                                            Status: {order.status}
                                        </Typography>

                                        {canRate && (
                                            <Box sx={{ mt: 1.5 }}>
                                                <Divider sx={{ mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Courier: <strong>{order.courierName}</strong>
                                                </Typography>

                                                {order.courierRated ? (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        <Rating
                                                            value={order.courierRating ?? 0}
                                                            max={5}
                                                            size="small"
                                                            readOnly
                                                        />
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            Your rating
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mt: 0.5,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <Rating
                                                            name={`rate-${order.id}`}
                                                            value={drafts[order.id] ?? 0}
                                                            max={5}
                                                            size="small"
                                                            onChange={(_, v) =>
                                                                setDrafts((d) => ({
                                                                    ...d,
                                                                    [order.id]: v,
                                                                }))
                                                            }
                                                        />
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={
                                                                !drafts[order.id] ||
                                                                submittingId === order.id
                                                            }
                                                            onClick={() => submitRating(order)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                textTransform: "none",
                                                            }}
                                                        >
                                                            {submittingId === order.id
                                                                ? "Saving…"
                                                                : "Rate courier"}
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="contained"
                                            onClick={() => navigate(`/orders/track/${order.id}`)}
                                            sx={{ borderRadius: 2, textTransform: "none" }}
                                        >
                                            Track Order
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default MyOrdersPage;
