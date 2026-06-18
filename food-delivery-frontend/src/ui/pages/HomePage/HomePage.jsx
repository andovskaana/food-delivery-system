import React, { useEffect, useMemo, useState } from "react";
import {
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Box,
    Chip,
    TextField,
} from "@mui/material";
import { Link } from "react-router";
import restaurantRepository from "../../../repository/restaurantRepository.js";
import banner from "../../../assets/banner.png";
import TimeBasedRecommendations from "../../components/recommendations/TimeBasedRecommendations.jsx";
import useAuth from "../../../hooks/useAuth.js";
import PopularRecommendations from "../../components/recommendations/PopularRecommendations.jsx";
import sentimentRepository from "../../../repository/sentimentRepository.js";
import RfmPromotionBanner from "../../components/promotions/RfmPromotionBanner.jsx";
import SegmentRecommendations from "../../components/recommendations/SegmentRecommendations.jsx";


/* ---------- opening-hours helpers (daily string only) ---------- */
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
    for (const { start, end } of intervals) {
        if (start === end) continue;
        if (start < end) {
            if (nowMin >= start && nowMin < end) return true;
        } else {
            // crosses midnight
            if (nowMin >= start || nowMin < end) return true;
        }
    }
    return false;
};

/* ---------- Restaurant card ---------- */
const RestaurantCard = ({ restaurant }) => {
    const [isOpenNow, setIsOpenNow] = useState(false);
    const [sentiment, setSentiment] = useState(null); // NEW

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
        const id = setInterval(compute, 60 * 1000);
        return () => clearInterval(id);
    }, [intervals]);

    //: sentiment fetch 
    useEffect(() => {
        let active = true;

        sentimentRepository
            .get(restaurant?.id)
            .then((res) => {
                if (!active) return;
                setSentiment(res?.data); // backend returns NUMBER (0–100)
            })
            .catch(() => {
                // silent fail → sentiment stays null
            });

        return () => {
            active = false;
        };
    }, [restaurant?.id]);

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                transition: "transform .15s ease, box-shadow .15s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                        "0 8px 20px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.06)",
                },
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    bgcolor: "background.default",
                }}
            >
                <Box
                    component="img"
                    alt={restaurant.name}
                    src={
                        restaurant.imageUrl ||
                        "https://via.placeholder.com/800x450?text=Restaurant"
                    }
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "28%",
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.06) 100%)",
                    }}
                />
            </Box>

            <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.25 }}
                >
                    {restaurant.name}
                </Typography>
                
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                    }}
                >
                    <Chip
                        label={`⭐ ${restaurant.averageRating ?? 4.5}`}
                        size="small"
                        variant="outlined"
                    />

                    <Chip
                        label={`${restaurant.deliveryTimeEstimate ?? 30} min`}
                        size="small"
                        variant="outlined"
                    />

                    <Chip
                        label={isOpenNow ? "Open" : "Closed"}
                        color={isOpenNow ? "success" : "default"}
                        size="small"
                    />

                    <Chip
                        label={
                            sentiment == null
                                ? "😊 Sentiment: -"
                                : `😊 Sentiment: ${(sentiment / 20).toFixed(1)}/5`
                        }
                        size="small"
                        variant="outlined"
                    />
                </Box>
            </CardContent>

            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                <Button
                    size="small"
                    variant="contained"
                    component={Link}
                    to={`/restaurants/${restaurant.id}`}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                    View Menu
                </Button>
            </CardActions>
        </Card>
    );
};

/* ---------- Page ---------- */
const HomePage = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const { user } = useAuth();

    useEffect(() => {
        let active = true;
        restaurantRepository
            .findAll()
            .then((res) => {
                if (!active) return;
                setRestaurants(res.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const categories = useMemo(() => {
        const set = new Set(
            (restaurants || [])
                .map((r) => (r.category || "").trim())
                .filter(Boolean)
        );
        const list = [...set].sort((a, b) => a.localeCompare(b));
        return ["All", ...list];
    }, [restaurants]);

    const filtered = restaurants.filter((r) => {
        const matchesSearch = (r.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesCategory =
            activeCategory === "All" ||
            (r.category || "").toLowerCase() === activeCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    if (loading) return <Typography>Loading restaurants...</Typography>;

    return (
        <Box>
            {/* HERO */}
            <Box
                sx={{
                    position: "relative",
                    mx: "calc(50% - 50dvw)",
                    width: "99.5dvw",
                    height: { xs: 280, md: 420 },
                    mb: 6,
                    overflow: "clip",
                    backgroundImage: `url(${banner})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45))",
                    }}
                />
                <Box
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 2,
                    }}
                >
                    <Box sx={{ width: "min(720px, 92vw)", textAlign: "center" }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                color: "#fff",
                                mb: 1,
                                lineHeight: 1.15,
                                fontSize: { xs: "1.75rem", md: "2.25rem" },
                            }}
                        >
                            Feast Your Senses,&nbsp;
                            <Box component="span" sx={{ color: "#f97316" }}>
                                Fast and Fresh
                            </Box>
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{ color: "rgba(255,255,255,.9)", mb: 3 }}
                        >
                            Order restaurant food, takeaway and groceries.
                        </Typography>

                        <TextField
                            fullWidth
                            placeholder="Search for restaurants…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            variant="outlined"
                            sx={{
                                background: "#fff",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    px: 1,
                                    "& fieldset": { borderColor: "transparent" },
                                    "&:hover fieldset": { borderColor: "#e5e7eb" },
                                    "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                                },
                                "& input": { py: 1.5 },
                            }}
                        />
                    </Box>
                </Box>
            </Box>
            {/* PERSONALIZED CONTENT - Only show for logged-in customers */}
            {user && user.roles?.includes("CUSTOMER") && (
                <>
                    {/* RFM Segment-based Promotion Banner */}
                    <RfmPromotionBanner />

                    {/* Segment-specific Recommendations */}
                    <SegmentRecommendations />

                    {/* Time-based Recommendations */}
                    <TimeBasedRecommendations />

                    {/* Popular/Trending Recommendations */}
                    <PopularRecommendations />
                </>
            )}
            {/* FILTER CHIPS */}
            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    pb: 0.5,
                    scrollSnapType: "x proximity",
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: "action.hover",
                        borderRadius: 999,
                    },
                }}
            >
                {categories.map((cat) => {
                    const selected = cat === activeCategory;
                    return (
                        <Chip
                            key={cat}
                            label={cat}
                            onClick={() => setActiveCategory(cat)}
                            clickable
                            sx={{
                                scrollSnapAlign: "start",
                                borderRadius: 2,
                                px: 0.5,
                                fontWeight: 700,
                                ...(selected
                                    ? {
                                        bgcolor: "primary.main",
                                        color: "#fff",
                                    }
                                    : {
                                        bgcolor: "background.paper",
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }),
                                "&:hover": selected
                                    ? { opacity: 0.95 }
                                    : { bgcolor: "action.hover" },
                            }}
                        />
                    );
                })}
            </Box>

            {/* LIST */}
            <Typography
                sx={{
                    fontWeight: 800,
                    lineHeight: 1.15,
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                    mb: 3,
                }}
            >
                Browse Restaurants
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",   // <-- exactly 4 per row on desktop
                    },
                    gap: 3,                    // matches Grid spacing={3}
                }}
            >
                {filtered.map((restaurant) => (
                    <Box key={restaurant.id}>
                        <RestaurantCard restaurant={restaurant} />
                    </Box>
                ))}
            </Box>



            {!filtered.length && (
                <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
                    No restaurants match “{searchTerm}”
                    {activeCategory !== "All" ? ` in ${activeCategory}` : ""}.
                </Typography>
            )}
        </Box>
    );
};

export default HomePage;
