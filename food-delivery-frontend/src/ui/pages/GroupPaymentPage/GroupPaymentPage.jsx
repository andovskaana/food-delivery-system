import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import groupOrderRepository from "../../../repository/groupOrderRepository.js";
import {
    Box,
    Typography,
    Stack,
    Button,
    Divider,
    LinearProgress,
    Alert as MuiAlert,
    Card,
    CardContent,
    Chip,
} from "@mui/material";

const GroupPaymentPage = () => {
    const { paymentToken } = useParams();
    const navigate = useNavigate();

    const [participant, setParticipant] = useState(null);
    const [groupStatus, setGroupStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);

    const fetchParticipant = async () => {
        try {
            const res = await groupOrderRepository.getParticipant(paymentToken);
            setParticipant(res.data);

            if (res.data.groupCode) {
                const statusRes = await groupOrderRepository.getStatus(res.data.groupCode);
                setGroupStatus(statusRes.data);
            }

            setError("");
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to load payment details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipant();
    }, [paymentToken]);

    useEffect(() => {
        if (!participant?.groupCode) return;

        const interval = setInterval(async () => {
            try {
                const res = await groupOrderRepository.getStatus(participant.groupCode);
                setGroupStatus(res.data);
            } catch (_) {
                // keep current UI if polling fails once
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [participant?.groupCode]);

    const handlePay = async () => {
        if (paying || !participant) return;

        setPaying(true);
        try {
            const res = await groupOrderRepository.payParticipant(paymentToken, true);
            setParticipant(res.data);

            if (res.data.groupCode) {
                const statusRes = await groupOrderRepository.getStatus(res.data.groupCode);
                setGroupStatus(statusRes.data);
            }

            setError("");
        } catch (e) {
            setError(e?.response?.data?.message || "Payment failed");
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <Typography>Loading…</Typography>;
    if (!participant) return <Typography>No payment record found.</Typography>;

    const isPaid = participant.paymentStatus === "CAPTURED";
    const groupProgress =
        groupStatus && Number(groupStatus.totalAmount || 0) > 0
            ? Math.min(100, (Number(groupStatus.paidAmount || 0) / Number(groupStatus.totalAmount || 0)) * 100)
            : 0;

    return (
        <Box sx={{ maxWidth: 620, mx: "auto", mt: 4, px: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        Pay Your Share
                    </Typography>

                    {error && (
                        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                            {error}
                        </MuiAlert>
                    )}

                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Participant
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {participant.displayName || "Guest"}
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Your Assigned Amount
                            </Typography>

                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {Number(participant.assignedAmount || 0).toFixed(2)} ден.
                            </Typography>

                            {!isPaid && Number(participant.assignedAmount || 0) > 0 && (
                                <Button variant="contained" size="large" onClick={handlePay} disabled={paying} sx={{ mt: 1 }}>
                                    Pay Now
                                </Button>
                            )}

                            {!isPaid && Number(participant.assignedAmount || 0) <= 0 && participant.groupCode && (
                                <MuiAlert severity="info" sx={{ mt: 1 }}>
                                    Your assigned amount is 0. Choose items on the group page first, then come back to pay.
                                    <Button sx={{ ml: 1 }} size="small" onClick={() => navigate(`/group-orders/${participant.groupCode}`)}>Choose items</Button>
                                </MuiAlert>
                            )}

                            {isPaid && (
                                <MuiAlert severity="success" sx={{ mt: 1 }}>
                                    Payment completed. Thank you!
                                </MuiAlert>
                            )}
                        </Box>

                        <Divider />

                        {groupStatus && (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        Group Progress
                                    </Typography>
                                    <Chip label={groupStatus.status} size="small" />
                                </Stack>

                                <LinearProgress variant="determinate" value={groupProgress} sx={{ mt: 1, height: 8, borderRadius: 10 }} />

                                <Typography variant="caption" color="text.secondary">
                                    Paid {Number(groupStatus.paidAmount || 0).toFixed(2)} / {Number(groupStatus.totalAmount || 0).toFixed(2)}
                                    {" "}({groupProgress.toFixed(0)}%)
                                </Typography>

                                {groupStatus.status === "FULLY_PAID" && (
                                    <MuiAlert severity="success" sx={{ mt: 1 }}>
                                        All participants paid. The order is confirmed.
                                    </MuiAlert>
                                )}

                                {groupStatus.status === "CANCELLED" && (
                                    <MuiAlert severity="warning" sx={{ mt: 1 }}>
                                        This group order has been cancelled.
                                    </MuiAlert>
                                )}

                                {groupStatus.status === "EXPIRED" && (
                                    <MuiAlert severity="error" sx={{ mt: 1 }}>
                                        This group order has expired.
                                    </MuiAlert>
                                )}

                                {participant.groupCode && (
                                    <Button
                                        sx={{ mt: 2 }}
                                        variant="outlined"
                                        onClick={() => navigate(`/group-orders/${participant.groupCode}`)}
                                    >
                                        Back to Group Status
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default GroupPaymentPage;
