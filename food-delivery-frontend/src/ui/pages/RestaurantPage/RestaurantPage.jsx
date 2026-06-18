import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
    Typography,
    Card,
    CardContent,
    Box,
    Divider,
    Chip,
    CardMedia,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import restaurantRepository from "../../../repository/restaurantRepository.js";
import productRepository from "../../../repository/productRepository.js";
import { addToCartRespectingSingleRestaurant } from "../../../repository/cartActions.js";
import reviewRepository from "../../../repository/reviewRepository.js";
import ReviewForm from "../../components/reviews/ReviewForm/ReviewForm.jsx";
import useAuth from "../../../hooks/useAuth.js";
import Alert from "../../../common/Alert.jsx";
import Tooltip from "@mui/material/Tooltip";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import sentimentRepository from "../../../repository/sentimentRepository.js";


/** Helpers */
const mkd = (n) => `${Number(n || 0).toFixed(0)} ден`;

/** Opening-hours: daily string only (e.g. "09:00-22:00" or "09:00-12:00, 13:00-18:00", supports "22:00-02:00") */
const timeToMinutes = (hhmm) => {
    const [h, m] = (hhmm || "").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
};

const parseIntervals = (value) => {
    if (!value || typeof value !== "string") return [];
    return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
            const [start, end] = part.split("-").map((s) => s.trim());
            if (!start || !end) return null;
            return { start: timeToMinutes(start), end: timeToMinutes(end) };
        })
        .filter(Boolean);
};

const isOpenAt = (nowMin, intervals) => {
    // supports overnight: e.g. 22:00-02:00
    for (const { start, end } of intervals) {
        if (start === end) continue; // ignore zero-length ranges
        if (start < end) {
            if (nowMin >= start && nowMin < end) return true;
        } else {
            // overnight crosses midnight
            if (nowMin >= start || nowMin < end) return true;
        }
    }
    return false;
};

const KorpaRowCard = ({ product, onAdd }) => {
    const { user } = useAuth();

    // Derive discount/old/new price
    const basePrice = Number(product.price || 0);
    const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
    const discountPct = product.discountPercent ?? product.discount ?? null;

    const computedDiscounted =
        discountPct != null ? basePrice * (1 - Number(discountPct) / 100) : null;

    const hasDiscount = Boolean(oldPrice) || discountPct != null;
    const newPrice = hasDiscount
        ? Number(product.discountedPrice ?? computedDiscounted ?? basePrice)
        : basePrice;

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 2,
                borderRadius: 2,
                overflow: "hidden",
                minHeight: 128,
                display: "flex",
                alignItems: "stretch",
            }}
        >
            {/* Left image (fixed size) */}
            <Box
                sx={{
                    width: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                    borderRight: "1px solid",
                    borderColor: "divider",
                }}
            >
                <CardMedia
                    component="img"
                    alt={product.name}
                    image={
                        product.imageUrl ||
                        "https://via.placeholder.com/300x200?text=Food"
                    }
                    sx={{
                        width: 140,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 1,
                    }}
                />
            </Box>

            {/* Middle content */}
            <CardContent
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    py: 2,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {product.name}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxWidth: { xs: "100%", md: "90%" },
                    }}
                >
                    {product.description}
                </Typography>

                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    {hasDiscount && (
                        <Chip
                            size="small"
                            label="АКЦИЈА"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                    {!!product.category && (
                        <Chip size="small" label={product.category} variant="outlined" />
                    )}
                </Box>
            </CardContent>

            {/* Right price + add button (fixed width) */}
            <Box
                sx={{
                    width: { xs: 150, sm: 220 },
                    px: 2,
                    py: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 1.25,
                    borderLeft: "1px solid",
                    borderColor: "divider",
                }}
            >
                {/* Prices */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1,
                        flexWrap: "wrap",
                    }}
                >
                    {hasDiscount && (
                        <Typography
                            variant="body1"
                            color="text.disabled"
                            sx={{ textDecoration: "line-through" }}
                        >
                            {mkd(oldPrice ?? basePrice)}
                        </Typography>
                    )}
                    <Typography
                        variant="h6"
                        sx={{ color: "success.main", fontWeight: 700 }}
                    >
                        {mkd(newPrice)}
                    </Typography>
                </Box>

                {/* Add button */}
                {user?.roles?.includes("CUSTOMER") ? (
                    <Button
                        variant="outlined"
                        onClick={() => onAdd?.(product.id)}
                        disabled={!product.isAvailable || product.quantity <= 0}
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 999,
                            fontWeight: 600,
                            textTransform: "none",
                        }}
                    >
                        {product.quantity <= 0 ? "Нема залиха" : "Додади"}
                    </Button>
                ) : (
                    <Box sx={{ height: 36 }} />
                )}
            </Box>
        </Card>
    );
};

const RestaurantPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Derived open/closed
    const [isOpenNow, setIsOpenNow] = useState(false);

    // Dialog state for closed-restaurant message
    const [closedDialogOpen, setClosedDialogOpen] = useState(false);

    // Category refs
    const categoryRefs = useRef({});
    const [activeCat, setActiveCat] = useState("");

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [sentimentScore, setSentimentScore] = useState(null);


    useEffect(() => {
        let active = true;
        Promise.all([
            restaurantRepository.findById(id),
            productRepository.findAll(),
            reviewRepository.list(id),
        ])
            .then(([r, p, rv]) => {
                if (!active) return;
                setRestaurant(r.data);
                setProducts(
                    p.data.filter((x) => String(x.restaurantId) === String(id))
                );
                setReviews(rv.data);
                setLoading(false);
            })
            .catch((err) => {
                // console.error("Error loading restaurant data:", err);
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        let active = true;

        sentimentRepository
            .get(id)
            .then((res) => {
                if (!active) return;
                setSentimentScore(res.data); // number 0–100
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [id]);


    const intervals = useMemo(() => {
        const raw = restaurant?.openHours || "09:00-22:00";
        return parseIntervals(raw);
    }, [restaurant?.openHours]);

    useEffect(() => {
        const compute = () => {
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();
            setIsOpenNow(isOpenAt(nowMin, intervals));
        };
        compute();
        const timer = setInterval(compute, 60 * 1000);
        return () => clearInterval(timer);
    }, [intervals]);

    const handleAdd = async (productId) => {
        if (!isOpenNow) {
            setClosedDialogOpen(true);
            return;
        }
        try {
            const res = await addToCartRespectingSingleRestaurant(productId);
            if (res?.ok) {
                setAlertMessage(res.replaced ? "Cart replaced and item added." : "Added to cart.");
                setAlertOpen(true);
            }
        } catch {
            setAlertMessage("Failed to add item to cart.");
            setAlertOpen(true);
        }
    };

    const handleReview = async ({ rating, comment }) => {
        try {
            await reviewRepository.add(id, { rating, comment });
            const rv = await reviewRepository.list(id);
            setReviews(rv.data);
            setAlertMessage("Review submitted successfully!");
            setAlertOpen(true);
        } catch {
            setAlertMessage("Failed to submit review.");
            setAlertOpen(true);
        }
    };

    const grouped = useMemo(() => {
        return products.reduce((acc, p) => {
            const cat = p.category?.trim() || "Other";
            (acc[cat] ||= []).push(p);
            return acc;
        }, {});
    }, [products]);

    const categories = Object.keys(grouped);

    const scrollToCategory = (cat) => {
        const el = categoryRefs.current[cat];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (!restaurant) return <Typography>Restaurant not found.</Typography>;

    return (
        <Box>
            {/* Restaurant Header */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
                <CardMedia
                    component="img"
                    height="300"
                    image={
                        restaurant.imageUrl ||
                        "https://via.placeholder.com/800x300?text=Restaurant"
                    }
                    alt={restaurant.name}
                />
                <CardContent>
                    <Typography variant="h3" gutterBottom>
                        {restaurant.name}
                    </Typography>

                    {/* Rating + Delivery + Sentiment + Open */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        {/* Rating */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <StarIcon sx={{ color: "#ffc107" }} />
                            <Typography variant="h6">
                                {restaurant.averageRating || 4.5}
                            </Typography>
                        </Box>

                        {/* Delivery */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AccessTimeIcon />
                            <Typography>
                                {restaurant.deliveryTimeEstimate || 30} min delivery
                            </Typography>
                        </Box>

                        {/* Sentiment */}
                        <Tooltip
                            arrow
                            title="Sentiment score based on analysis of customer review comments"
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    cursor: "help",
                                }}
                            >
                                <EmojiEmotionsIcon sx={{ color: "#f97316" }} />
                                <Typography variant="h6">
                                    {sentimentScore != null
                                        ? (sentimentScore / 20).toFixed(1) + "/5"
                                        : "-"}
                                </Typography>
                            </Box>
                        </Tooltip>

                        {/* Open / Closed */}
                        <Chip
                            label={isOpenNow ? "Open" : "Closed"}
                            color={isOpenNow ? "success" : "error"}
                        />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {restaurant.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Opening Hours
                        </Typography>
                        <Typography>
                            {restaurant.openHours || "09:00-22:00"}
                        </Typography>
                    </Box>

                    {restaurant.address && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <LocationOnIcon color="action" />
                            <Typography color="text.secondary">
                                {restaurant.address.line1}, {restaurant.address.city}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Category navigation */}
            {!!categories.length && (
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        py: 1,
                        mb: 2,
                        bgcolor: "background.paper",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "nowrap",
                            overflowX: "auto",
                            gap: 1,
                            px: 0.5,
                            "::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
                        {categories.map((cat) => (
                            <Chip
                                key={cat}
                                label={cat}
                                clickable
                                onClick={() => scrollToCategory(cat)}
                                variant={activeCat === cat ? "filled" : "outlined"}
                                color={activeCat === cat ? "primary" : "default"}
                                sx={{ flexShrink: 0 }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Menu Section */}
            <Typography variant="h4" sx={{ mb: 2 }}>
                Мени
            </Typography>

            {categories.map((cat) => (
                <Box
                    key={cat}
                    ref={(el) => (categoryRefs.current[cat] = el)}
                    data-cat={cat}
                    sx={{ mb: 4, scrollMarginTop: 88 }}
                >
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        {cat}
                    </Typography>

                    <Box>
                        {grouped[cat].map((product) => (
                            <KorpaRowCard
                                key={product.id}
                                product={product}
                                onAdd={handleAdd}
                            />
                        ))}
                    </Box>
                </Box>
            ))}

            {products.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
                    No menu items available.
                </Typography>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Reviews Section */}
            <Typography variant="h4" sx={{ mb: 2 }}>
                Reviews
            </Typography>

            {user?.roles?.includes("CUSTOMER") && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Write a Review
                        </Typography>
                        <ReviewForm onSubmit={handleReview} />
                    </CardContent>
                </Card>
            )}

            {reviews.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {reviews.map((r) => (
                        <Card
                            key={r.id}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            }}
                        >
                            <CardContent>
                                {/* Username + stars */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 600 }}>
                                        {r.userUsername || "Anonymous"}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                sx={{
                                                    color: i < r.rating ? "#ffc107" : "#e0e0e0",
                                                    fontSize: 20,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                {/* Comment */}
                                <Typography variant="body2" color="text.secondary">
                                    {r.comment}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Typography color="text.secondary">No reviews yet.</Typography>
            )}

            {/* Closed restaurant dialog */}
            <Dialog
                open={closedDialogOpen}
                onClose={() => setClosedDialogOpen(false)}
            >
                <DialogTitle>Cannot order</DialogTitle>
                <DialogContent>
                    The restaurant is currently closed. Please try again during
                    opening hours.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClosedDialogOpen(false)}>OK</Button>
                </DialogActions>
            </Dialog>
            <Alert open={alertOpen} onClose={() => setAlertOpen(false)} message={alertMessage} />
        </Box>
    );
};

export default RestaurantPage;