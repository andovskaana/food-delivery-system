import React, { useState, useRef } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CircularProgress,
    CardMedia,
    IconButton,
    Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link } from "react-router";
import useTimeBasedRecommendations from "../../../hooks/useTimeBasedRecommendations.js";
import { addToCartRespectingSingleRestaurant } from "../../../repository/cartActions.js";
import Alert from "../../../common/Alert.jsx";

const TimeBasedRecommendations = () => {
    const { recommendations, loading, error } = useTimeBasedRecommendations();
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleAddToCart = async (productId) => {
        try {
            const res = await addToCartRespectingSingleRestaurant(productId);
            if (res?.ok) {
                setAlertMessage(
                    res.replaced
                        ? "Cart replaced and item added."
                        : "Added to cart!"
                );
                setAlertOpen(true);
            }
        } catch (err) {
            setAlertMessage("Failed to add item to cart.");
            setAlertOpen(true);
        }
    };

    const getCurrentTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12 && hour > 6) return "Good Morning! ☀️";
        if (hour < 17) return "Good Afternoon! 🌤️";
        return "Good Evening! 🌙";
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
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !recommendations || recommendations.length === 0) {
        console.log("SHOWS ERROR NULL")
        return null;
    }

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
                    <AccessTimeIcon
                        sx={{ fontSize: 32, color: "primary.main" }}
                    />
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 800, lineHeight: 1.2 }}
                        >
                            {getCurrentTimeGreeting()}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Based on your ordering habits at this time
                        </Typography>
                    </Box>
                </Box>

                <Tooltip title="These recommendations are personalized based on what you typically order at this time of day">
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
                        "&::-webkit-scrollbar": {
                            display: "none",
                        },
                    }}
                >
                    {recommendations.slice(0, 8).map((product) => (
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
                                transition:
                                    "transform .15s ease, box-shadow .15s ease",
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
                                    label="Recommended"
                                    size="small"
                                    color="primary"
                                    sx={{
                                        position: "absolute",
                                        top: 12,
                                        left: 12,
                                        fontWeight: 600,
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
                                    {Number(product.price || 0).toFixed(0)} ден
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        width: "100%",
                                    }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={`/products/${product.id}`}
                                        sx={{
                                            flex: 1,
                                            borderRadius: 2,
                                            textTransform: "none",
                                        }}
                                    >
                                        Details
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={
                                            !product.isAvailable ||
                                            product.quantity <= 0
                                        }
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
                onClose={() => setAlertOpen(false)}
                message={alertMessage}
            />
        </Box>
    );
};

export default TimeBasedRecommendations;