import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CardMedia, CardActions,
    Button, Chip, CircularProgress, Alert, Avatar, Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link } from 'react-router';
import TimeBasedRecommendations from '../components/recommendations/TimeBasedRecommendations.jsx';
import PopularRecommendations from '../components/recommendations/PopularRecommendations.jsx';
import axiosInstance from '../../axios/axios.js';
import { addToCartRespectingSingleRestaurant } from '../../repository/cartActions.js';

const PRIMARY = '#f97316';

const getEmojiForCategory = (cat) => {
    const map = { Pizza: '🍕', Burger: '🍔', Pasta: '🍝', Salad: '🥗', Sushi: '🍣', Dessert: '🍰', Drink: '🥤', Drinks: '🥤' };
    return map[cat] || '🍽️';
};

const ProductCard = ({ product, onAdd }) => (
    <Card sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        transition: 'transform .15s ease, box-shadow .15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
    }}>
        {product.imageUrl ? (
            <CardMedia component="img" height="160" image={product.imageUrl} alt={product.name} sx={{ objectFit: 'cover' }} />
        ) : (
            <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', fontSize: 64 }}>
                {getEmojiForCategory(product.category)}
            </Box>
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {product.category && (
                <Chip label={product.category} size="small" variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1, fontSize: 11 }} />
            )}
            <Typography variant="subtitle1" fontWeight={700} sx={{
                mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {product.name}
            </Typography>
            {product.description && (
                <Typography variant="body2" color="text.secondary" sx={{
                    mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1,
                }}>
                    {product.description}
                </Typography>
            )}
            <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mt: 'auto' }}>
                {Number(product.price || 0).toFixed(0)} ден
            </Typography>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
            <Button size="small" variant="outlined" component={Link} to={`/products/${product.id}`}
                    sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}>
                Details
            </Button>
            <Button size="small" variant="contained" startIcon={<ShoppingCartIcon />}
                    disabled={!product.isAvailable || product.quantity <= 0}
                    onClick={() => onAdd(product.id)}
                    sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, '&:hover': { bgcolor: '#ea6d0d' } }}>
                Add
            </Button>
        </CardActions>
    </Card>
);

const RecommendationsPage = () => {
    const [mlRecs, setMlRecs] = useState([]);
    const [mlLoading, setMlLoading] = useState(true);
    const [mlError, setMlError] = useState(null);
    const [cartAlert, setCartAlert] = useState(null);

    useEffect(() => {
        axiosInstance.get('/recommendations/advanced', { params: { limit: 12, applyRules: true } })
            .then(res => setMlRecs(res.data || []))
            .catch(() => setMlError('ML service unavailable — showing other recommendations below.'))
            .finally(() => setMlLoading(false));
    }, []);

    const handleAdd = async (productId) => {
        try {
            const res = await addToCartRespectingSingleRestaurant(productId);
            if (res?.ok) setCartAlert(res.replaced ? 'Cart replaced and item added!' : 'Added to cart!');
        } catch {
            setCartAlert('Failed to add to cart.');
        }
        setTimeout(() => setCartAlert(null), 3000);
    };

    return (
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 52, height: 52 }}>
                    <AutoAwesomeIcon />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Recommendations</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Personalized picks based on your habits, the time of day, and what's trending
                    </Typography>
                </Box>
            </Stack>

            {cartAlert && (
                <Alert severity="success" onClose={() => setCartAlert(null)} sx={{ mb: 3 }}>{cartAlert}</Alert>
            )}

            {/* Section 1: Time-based */}
            <Box sx={{ mb: 5 }}>
                <TimeBasedRecommendations />
            </Box>

            {/* Section 2: Popular / Trending */}
            <Box sx={{ mb: 5 }}>
                <PopularRecommendations />
            </Box>

            {/* Section 3: ML Personalized */}
            <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <AutoAwesomeIcon sx={{ fontSize: 32, color: PRIMARY }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Just For You ✨</Typography>
                        <Typography variant="body2" color="text.secondary">
                            ML-powered picks based on your order history
                        </Typography>
                    </Box>
                </Stack>

                {mlLoading && (
                    <Box textAlign="center" py={4}><CircularProgress sx={{ color: PRIMARY }} /></Box>
                )}
                {mlError && !mlLoading && (
                    <Alert severity="warning" sx={{ mb: 2 }}>{mlError}</Alert>
                )}
                {!mlLoading && mlRecs.length > 0 && (
                    <Grid container spacing={3}>
                        {mlRecs.map(product => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                                <ProductCard product={product} onAdd={handleAdd} />
                            </Grid>
                        ))}
                    </Grid>
                )}
                {!mlLoading && !mlError && mlRecs.length === 0 && (
                    <Box textAlign="center" py={6}>
                        <Typography fontSize={64} mb={2}>🍽️</Typography>
                        <Typography variant="h6" fontWeight={600}>No personalized picks yet</Typography>
                        <Typography color="text.secondary">Start ordering to get ML-powered recommendations!</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default RecommendationsPage;
