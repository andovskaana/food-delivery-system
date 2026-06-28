import React from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { Link } from "react-router";

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
};

const ActivePromotionsBanner = ({ promotions = [], title = "Active Promotions", compact = false }) => {
    if (!promotions.length) return null;

    return (
        <Box sx={{ mb: compact ? 2 : 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <LocalOfferIcon sx={{ color: "#f97316" }} />
                <Typography variant={compact ? "h6" : "h5"} sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
            </Stack>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: compact
                        ? "1fr"
                        : { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                    gap: 2,
                }}
            >
                {promotions.map((promotion) => {
                    const validUntil = formatDate(promotion.validUntil);
                    const isProductOffer = promotion.scope === "PRODUCT" && promotion.productName;

                    return (
                        <Paper
                            key={promotion.id}
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                border: "1px solid #fed7aa",
                                background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
                            }}
                        >
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                                    <Box>
                                        <Typography sx={{ fontWeight: 800 }}>
                                            {promotion.promotionName || "Special offer"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {promotion.restaurantName}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        label={promotion.discountLabel || "Offer"}
                                        sx={{ bgcolor: "#f97316", color: "white", fontWeight: 800 }}
                                    />
                                </Stack>

                                {promotion.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {promotion.description}
                                    </Typography>
                                )}

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        icon={<RestaurantMenuIcon />}
                                        label={isProductOffer ? promotion.productName : "All products"}
                                    />
                                    {validUntil && (
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            icon={<AccessTimeIcon />}
                                            label={`Until ${validUntil}`}
                                        />
                                    )}
                                </Stack>

                                {!compact && promotion.restaurantId && (
                                    <Button
                                        size="small"
                                        component={Link}
                                        to={`/restaurants/${promotion.restaurantId}`}
                                        sx={{ alignSelf: "flex-start", color: "#f97316", fontWeight: 700 }}
                                    >
                                        View menu
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ActivePromotionsBanner;
