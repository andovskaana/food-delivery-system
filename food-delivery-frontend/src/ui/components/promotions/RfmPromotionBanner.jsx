import React, { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    CircularProgress,
    Skeleton,
    IconButton,
    Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import useRfmOffers from "../../../hooks/useRfmOffers.js";

const getIconForType = (type, icon) => {
    const iconMap = {
        crown: <EmojiEventsIcon />,
        star: <StarIcon />,
        truck: <LocalShippingIcon />,
        gift: <CardGiftcardIcon />,
        heart: <FavoriteIcon />,
        clock: <AccessTimeIcon />,
        fire: <WhatshotIcon />,
        tag: <LocalOfferIcon />,
        "plus-circle": <CardGiftcardIcon />,
        sparkles: <StarIcon />,
    };
    return iconMap[icon] || <LocalOfferIcon />;
};

const getSegmentEmoji = (segment) => {
    const emojiMap = {
        Champions: "🏆",
        "Loyal Customers": "💙",
        "Potential Loyalists": "🌟",
        "New Customers": "👋",
        "At Risk": "⚠️",
        "Can't Lose Them": "🔥",
        "Lost Customers": "💔",
        Hibernating: "😴",
        Promising: "📈",
        "Need Attention": "👀",
        "About to Sleep": "💤",
    };
    return emojiMap[segment] || "🎯";
};

const RfmPromotionBanner = () => {
    const { offers, loading, error } = useRfmOffers();
    const [copied, setCopied] = useState(false);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <Box sx={{ mb: 4 }}>
                <Skeleton variant="rounded" height={180} />
            </Box>
        );
    }

    if (error || !offers || !offers.promotions || offers.promotions.length === 0) {
        return null;
    }

    const { segment, promotions } = offers;
    const mainPromotion = promotions[0];

    return (
        <Box sx={{ mb: 4 }}>
            {/* Main Promotion Banner */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${mainPromotion.badgeColor}15 0%, ${mainPromotion.badgeColor}08 100%)`,
                    border: `2px solid ${mainPromotion.badgeColor}30`,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background decoration */}
                <Box
                    sx={{
                        position: "absolute",
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: `${mainPromotion.badgeColor}10`,
                    }}
                />

                <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: mainPromotion.badgeColor,
                                color: "white",
                                fontSize: 28,
                            }}
                        >
                            {getIconForType(mainPromotion.type, mainPromotion.badgeIcon)}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Typography
                                    variant="h5"
                                    sx={{ fontWeight: 800, color: mainPromotion.badgeColor }}
                                >
                                    {mainPromotion.title}
                                </Typography>
                                <Typography variant="h5">{getSegmentEmoji(segment)}</Typography>
                            </Box>
                            <Typography variant="body1" color="text.secondary">
                                {mainPromotion.description}
                            </Typography>
                        </Box>

                        {mainPromotion.discountPercent && (
                            <Chip
                                label={`${mainPromotion.discountPercent}% OFF`}
                                sx={{
                                    backgroundColor: mainPromotion.badgeColor,
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: "1.1rem",
                                    height: 40,
                                    px: 1,
                                }}
                            />
                        )}
                    </Box>

                    {/* Coupon code */}
                    {mainPromotion.couponCode && (
                        <Box sx={{ mt: 1 }}>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    backgroundColor: "white",
                                    borderRadius: 2,
                                    border: `2px dashed ${mainPromotion.badgeColor}`,
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    Use code:
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 800, letterSpacing: 1 }}
                                >
                                    {mainPromotion.couponCode}
                                </Typography>
                                <Tooltip title={copied ? "Copied!" : "Copy code"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopyCode(mainPromotion.couponCode)}
                                        sx={{ ml: 0.5 }}
                                    >
                                        {copied ? (
                                            <CheckIcon fontSize="small" color="success" />
                                        ) : (
                                            <ContentCopyIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                Enter this code at checkout to apply your discount
                            </Typography>
                        </Box>
                    )}

                    {/* Expiration warning */}
                    {mainPromotion.expiresAt && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary">
                                Limited time offer
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Additional promotions (if any) */}
            {promotions.length > 1 && (
                <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
                    {promotions.slice(1).map((promo, index) => (
                        <Paper
                            key={index}
                            elevation={0}
                            sx={{
                                flex: "1 1 200px",
                                p: 2,
                                borderRadius: 3,
                                backgroundColor: `${promo.badgeColor}10`,
                                border: `1px solid ${promo.badgeColor}30`,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
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
                                    backgroundColor: promo.badgeColor,
                                    color: "white",
                                }}
                            >
                                {getIconForType(promo.type, promo.badgeIcon)}
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {promo.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {promo.description}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default RfmPromotionBanner;
