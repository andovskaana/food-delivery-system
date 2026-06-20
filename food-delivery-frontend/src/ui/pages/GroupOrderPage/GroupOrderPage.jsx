import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import groupOrderRepository from "../../../repository/groupOrderRepository.js";
import {
    Box,
    Typography,
    Stack,
    Button,
    TextField,
    Divider,
    LinearProgress,
    Alert as MuiAlert,
    Card,
    CardContent,
    Chip,
} from "@mui/material";

const GroupOrderPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [joining, setJoining] = useState(false);
    const [canceling, setCanceling] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await groupOrderRepository.getStatus(code);
            setStatus(res.data);
            setError("");
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to fetch group order status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [code]);

    const getTokenFromPaymentLink = (paymentLink) => {
        if (!paymentLink) return null;
        const parts = paymentLink.split("/").filter(Boolean);
        return parts[parts.length - 1];
    };

    const handleJoin = async () => {
        if (joining) return;

        if (!displayName.trim()) {
            setError("Please enter your name to join.");
            return;
        }

        setJoining(true);
        try {
            const res = await groupOrderRepository.joinGroupOrder(code, displayName.trim(), email.trim() || null);
            const token = getTokenFromPaymentLink(res?.data?.paymentLink);

            if (token) {
                navigate(`/group-orders/participant/${token}`);
            } else {
                setError("You joined, but the payment link could not be opened.");
                await fetchStatus();
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to join group order");
        } finally {
            setJoining(false);
        }
    };

    const handleCancel = async () => {
        if (canceling) return;

        setCanceling(true);
        try {
            await groupOrderRepository.cancelGroupOrder(code);
            await fetchStatus();
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to cancel group order");
        } finally {
            setCanceling(false);
        }
    };

    if (loading) return <Typography>Loading…</Typography>;
    if (!status) return <Typography>No group order found.</Typography>;

    const participants = status.participants ?? [];
    const joinedCount = status.joinedParticipantsCount ?? participants.length;
    const paidCount = status.paidParticipantsCount ?? participants.filter((p) => p.paymentStatus === "CAPTURED").length;
    const remaining = Math.max(0, Number(status.remainingAmount ?? ((status.totalAmount || 0) - (status.paidAmount || 0))));
    const progress =
        Number(status.totalAmount || 0) > 0
            ? Math.min(100, (Number(status.paidAmount || 0) / Number(status.totalAmount || 0)) * 100)
            : 0;

    // A group is "active" only while it can still take joins/payments.
    // Pay buttons and the join form are gated on this so a CANCELLED / EXPIRED /
    // FULLY_PAID group no longer shows actionable controls.
    const isActive =
        status.status === "WAITING_FOR_PARTICIPANTS" ||
        status.status === "PARTIALLY_PAID";

    const canJoin =
        isActive &&
        joinedCount < Number(status.splitCount || 0);

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", mt: 4, px: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        Group Order
                    </Typography>

                    {error && (
                        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                            {error}
                        </MuiAlert>
                    )}

                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Invite Code
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                                    {status.groupCode}
                                </Typography>
                                {/* RECONCILE: if your running build shows an "Equal split" / split-type
                                    chip here, keep that chip — it is not in this zip version. */}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/group-orders/${status.groupCode}`)}
                                >
                                    Copy Link
                                </Button>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total Amount
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {Number(status.totalAmount || 0).toFixed(2)} ден.
                            </Typography>

                            <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 10 }} />

                            <Typography variant="caption" color="text.secondary">
                                Paid {Number(status.paidAmount || 0).toFixed(2)} / {Number(status.totalAmount || 0).toFixed(2)}
                                {" "}({progress.toFixed(0)}%) · Remaining {remaining.toFixed(2)} ден.
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Participants ({joinedCount}/{status.splitCount}) · Paid ({paidCount}/{status.splitCount})
                                </Typography>
                                <Chip label={status.status} size="small" color={status.status === "FULLY_PAID" ? "success" : "default"} />
                            </Stack>

                            <Stack spacing={1}>
                                {participants.map((p, idx) => {
                                    const token = getTokenFromPaymentLink(p.paymentLink);
                                    const isPaid = p.paymentStatus === "CAPTURED";

                                    return (
                                        <Box
                                            key={p.id ?? idx}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                p: 1.25,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 1,
                                                gap: 1,
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {p.displayName || "Guest"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {isPaid
                                                        ? `Paid ${Number(p.paidAmount || 0).toFixed(2)} ден.`
                                                        : `Owes ${Number(p.assignedAmount || 0).toFixed(2)} ден.`}
                                                </Typography>
                                            </Box>

                                            {/* Pay only shows while the group is active. */}
                                            {isActive && !isPaid && token && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => navigate(`/group-orders/participant/${token}`)}
                                                >
                                                    Pay
                                                </Button>
                                            )}

                                            {isPaid && <Chip label="Paid" color="success" size="small" />}
                                        </Box>
                                    );
                                })}

                                {isActive &&
                                    Array.from({ length: Math.max(0, Number(status.splitCount || 0) - joinedCount) }).map((_, idx) => (
                                        <Box
                                            key={`empty-${idx}`}
                                            sx={{
                                                p: 1.25,
                                                border: "1px dashed",
                                                borderColor: "divider",
                                                borderRadius: 1,
                                                color: "text.secondary",
                                            }}
                                        >
                                            Slot available
                                        </Box>
                                    ))}
                            </Stack>
                        </Box>

                        {canJoin && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                    Join this group order
                                </Typography>

                                <Stack spacing={1}>
                                    <TextField
                                        label="Your Name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Email (optional)"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleJoin}
                                        disabled={joining}
                                        sx={{ alignSelf: "flex-start" }}
                                    >
                                        Join & Pay
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        {isActive && (
                            <Button variant="outlined" color="error" onClick={handleCancel} disabled={canceling}>
                                Cancel Group Order
                            </Button>
                        )}

                        {status.status === "FULLY_PAID" && (
                            <MuiAlert severity="success">
                                All participants paid — order confirmed and sent to restaurant/courier.
                            </MuiAlert>
                        )}

                        {status.status === "CANCELLED" && (
                            <MuiAlert severity="warning">
                                This group order has been cancelled. The items have been returned to the creator's cart.
                            </MuiAlert>
                        )}

                        {status.status === "EXPIRED" && (
                            <MuiAlert severity="error">
                                This group order has expired.
                            </MuiAlert>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default GroupOrderPage;
