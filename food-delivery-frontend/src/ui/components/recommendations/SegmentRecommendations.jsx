import React, { useState, useRef } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CardMedia,
    IconButton,
    Tooltip,
    Skeleton,
} from "@mui/material";
import RecommendIcon from "@mui/icons-material/Recommend";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link } from "react-router";
import useRfmOffers from "../../../hooks/useRfmOffers.js";
import { addToCartRespectingSingleRestaurant } from "../../../repository/cartActions.js";
import Alert from "../../../common/Alert.jsx";

const getSegmentTitle = (segment) => {
    const titles = {
        Champions: "Your Favorites & New Discoveries",
        "Loyal Customers": "Complete Your Meal",
        "Potential Loyalists": "More of What You Love",
        "New Customers": "Popular Picks to Try",
        "At Risk": "Remember These?",
        "Can't Lose Them": "We've Saved the Best for You",
        "Lost Customers": "Welcome Back Specials",
        Hibernating: "Rediscover Great Food",
        Promising: "Keep Exploring",
        "Need Attention": "Your Past Favorites",
        "About to Sleep": "Don't Miss Out",
    };
    return titles[segment] || "Recommended for You";
};

const getSegmentSubtitle = (segment) => {
    const subtitles = {
        Champions: "Handpicked based on your excellent taste",
        "Loyal Customers": "Add desserts, drinks, or sides to your order",
        "Potential Loyalists": "Same cuisines you've enjoyed before",
        "New Customers": "Best sellers loved by our community",
        "At Risk": "From restaurants you've ordered before",
        "Can't Lose Them": "Exclusive picks just for you",
        "Lost Customers": "Top-rated items waiting for you",
        Hibernating: "Popular dishes you might like",
        Promising: "Continue your food journey",
        "Need Attention": "From your favorite restaurants",
        "About to Sleep": "Limited time recommendations",
    };
    return subtitles[segment] || "Personalized recommendations based on your preferences";
};

const getSegmentBadge = (segment) => {
    const badges = {
        Champions: { label: "VIP Pick", color: "#10B981" },
        "Loyal Customers": { label: "Upsell", color: "#3B82F6" },
        "Potential Loyalists": { label: "For You", color: "#F59E0B" },
        "New Customers": { label: "Popular", color: "#8B5CF6" },
        "At Risk": { label: "Miss You", color: "#EF4444" },
        "Can't Lose Them": { label: "Special", color: "#DC2626" },
        "Lost Customers": { label: "Welcome Back", color: "#1F2937" },
    };
    return badges[segment] || { label: "Recommended", color: "#f97316" };
};

const SegmentRecommendations = () => {
    const { offers, loading, error } = useRfmOffers();
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleAddToCart = async (productId) => {
        try {
            const res = await addToCartRespectingSingleRestaurant(productId);
            if (res?.ok) {
                setAlertMessage(res.replaced ? "Cart replaced and item added." : "Added to cart!");
                setAlertOpen(true);
            }
        } catch (err) {
            setAlertMessage("Failed to add item to cart.");
            setAlertOpen(true);
        }
    };

    const checkArrows = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320;
            const newScrollLeft =
                direction === "left"
                    ? scrollContainerRef.current.scrollLeft - scrollAmount
                    : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: "smooth",
            });

            setTimeout(checkArrows, 300);
        }
    };

    if (loading) {
        return (
            <Box sx={{ mb: 6 }}>
                <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", gap: 3 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rounded" width={280} height={420} />
                    ))}
                </Box>
            </Box>
        );
    }

    if (
        error ||
        !offers ||
        !offers.recommendedProducts ||
        offers.recommendedProducts.length === 0
    ) {
        return null;
    }

    const { segment, recommendedProducts } = offers;
    const badge = getSegmentBadge(segment);

    return (
        <Box sx={{ mb: 6 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <RecommendIcon sx={{ fontSize: 32, color: badge.color }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {getSegmentTitle(segment)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {getSegmentSubtitle(segment)}
                        </Typography>
                    </Box>
                </Box>

                <Tooltip title="Personalized recommendations based on your ordering history and preferences">
                    <IconButton size="small">
                        <InfoOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ position: "relative" }}>
                {showLeftArrow && (
                    <IconButton
                        onClick={() => scroll("left")}
                        sx={{
                            position: "absolute",
                            left: -20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 2,
                            backgroundColor: "white",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            "&:hover": {
                                backgroundColor: "white",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            },
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}

                <Box
                    ref={scrollContainerRef}
                    onScroll={checkArrows}
                    sx={{
                        display: "flex",
                        gap: 3,
                        overflowX: "auto",
                        pb: 2,
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": { display: "none" },
                    }}
                >
                    {recommendedProducts.slice(0, 10).map((product) => (
                        <Card
                            key={product.id}
                            sx={{
                                minWidth: 280,
                                maxWidth: 280,
                                height: 420,
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 3,
                                overflow: "hidden",
                                flexShrink: 0,
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                                transition: "transform .15s ease, box-shadow .15s ease",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow:
                                        "0 8px 20px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.06)",
                                },
                            }}
                        >
                            <Box sx={{ position: "relative", flexShrink: 0 }}>
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={
                                        product.imageUrl ||
                                        "https://via.placeholder.com/400x160?text=Food"
                                    }
                                    alt={product.name}
                                    sx={{ objectFit: "cover" }}
                                />
                                <Chip
                                    label={badge.label}
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        top: 12,
                                        left: 12,
                                        fontWeight: 600,
                                        backgroundColor: badge.color,
                                        color: "white",
                                    }}
                                />
                            </Box>

                            <CardContent
                                sx={{
                                    flexGrow: 1,
                                    pb: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 700,
                                        mb: 0.5,
                                        lineHeight: 1.25,
                                        height: 40,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {product.name}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 1,
                                        height: 60,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {product.description}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        minHeight: 32,
                                        mt: "auto",
                                    }}
                                >
                                    {product.category && (
                                        <Chip
                                            label={product.category}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </CardContent>

                            <CardActions
                                sx={{
                                    pt: 0,
                                    px: 2,
                                    pb: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                    flexShrink: 0,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: "success.main",
                                        width: "100%",
                                        textAlign: "center",
                                    }}
                                >
                                    {Number(product.price || 0).toFixed(0)} MKD
                                </Typography>

                                <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={`/products/${product.id}`}
                                        sx={{ flex: 1, borderRadius: 2, textTransform: "none" }}
                                    >
                                        Details
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={!product.isAvailable || product.quantity <= 0}
                                        startIcon={<ShoppingCartIcon />}
                                        sx={{
                                            flex: 1,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                            </CardActions>
                        </Card>
                    ))}
                </Box>

                {showRightArrow && (
                    <IconButton
                        onClick={() => scroll("right")}
                        sx={{
                            position: "absolute",
                            right: -20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 2,
                            backgroundColor: "white",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            "&:hover": {
                                backgroundColor: "white",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                )}
            </Box>

            <Alert
                open={alertOpen}
                message={alertMessage}
                severity="success"
                onClose={() => setAlertOpen(false)}
            />
        </Box>
    );
};

export default SegmentRecommendations;
