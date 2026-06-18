import React from "react";
import {
    Box,
    Typography,
    LinearProgress,
    Paper,
    Skeleton,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useFreeDelivery from "../../../hooks/useFreeDelivery.js";

const FreeDeliveryBanner = ({ cartTotal = 0 }) => {
    const { deliveryInfo, loading, error } = useFreeDelivery(cartTotal);

    if (loading) {
        return <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />;
    }

    if (error || !deliveryInfo) {
        return null;
    }

    const { eligible, isFree, thresholdAmount, amountRemaining, message } = deliveryInfo;

    // VIP Free Delivery
    if (eligible && isFree && !thresholdAmount) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #10B98115 0%, #10B98108 100%)",
                    border: "2px solid #10B98130",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#10B981",
                        color: "white",
                    }}
                >
                    <CheckCircleIcon />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#10B981" }}>
                        VIP Free Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {message}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    // Threshold-based free delivery
    if (eligible && thresholdAmount) {
        const progress = Math.min(100, (cartTotal / thresholdAmount) * 100);

        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 3,
                    background: isFree
                        ? "linear-gradient(135deg, #10B98115 0%, #10B98108 100%)"
                        : "linear-gradient(135deg, #3B82F615 0%, #3B82F608 100%)",
                    border: isFree ? "2px solid #10B98130" : "2px solid #3B82F630",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isFree ? "#10B981" : "#3B82F6",
                            color: "white",
                        }}
                    >
                        {isFree ? <CheckCircleIcon /> : <LocalShippingIcon />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: isFree ? "#10B981" : "#3B82F6" }}
                        >
                            {isFree ? "Free Delivery Unlocked!" : "Free Delivery Progress"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {message}
                        </Typography>
                    </Box>
                    {!isFree && (
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 800, color: "#3B82F6" }}
                        >
                            {Math.ceil(amountRemaining)} MKD
                        </Typography>
                    )}
                </Box>

                {!isFree && (
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#3B82F620",
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: "#3B82F6",
                                borderRadius: 4,
                            },
                        }}
                    />
                )}

                {!isFree && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 0.5,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {cartTotal.toFixed(0)} MKD
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {thresholdAmount.toFixed(0)} MKD
                        </Typography>
                    </Box>
                )}
            </Paper>
        );
    }

    // Standard delivery - show delivery fee info
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                background: "linear-gradient(135deg, #6B728015 0%, #6B728008 100%)",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 2,
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#6B7280",
                    color: "white",
                }}
            >
                <LocalShippingIcon fontSize="small" />
            </Box>
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Delivery Fee: 50 MKD
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {message || "Standard delivery fee applies to your order"}
                </Typography>
            </Box>
        </Paper>
    );
};

export default FreeDeliveryBanner;
