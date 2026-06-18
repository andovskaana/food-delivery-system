// Additional reusable components for Wolt-like design

// OrderStatusChip.jsx
import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const OrderStatusChip = ({ status }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'PENDING':
                return { label: 'Pending', color: 'default', icon: <AccessTimeIcon /> };
            case 'CONFIRMED':
                return { label: 'Confirmed', color: 'info', icon: <CheckCircleIcon /> };
            case 'IN_PREPARATION':
                return { label: 'Preparing', color: 'warning', icon: <RestaurantIcon /> };
            case 'PICKED_UP':
            case 'EN_ROUTE':
                return { label: 'On the way', color: 'warning', icon: <LocalShippingIcon /> };
            case 'DELIVERED':
                return { label: 'Delivered', color: 'success', icon: <CheckCircleIcon /> };
            default:
                return { label: status, color: 'default', icon: null };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Chip
            label={config.label}
            color={config.color}
            icon={config.icon}
            size="small"
            sx={{
                fontWeight: 'medium',
                '& .MuiChip-icon': {
                    fontSize: 16
                }
            }}
        />
    );
};

// DeliveryCard.jsx - For courier dashboard
import React from 'react';
import { Card, CardContent, Typography, Box, Button, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';

const DeliveryCard = ({ order, onAction, actionLabel, actionColor = 'primary' }) => (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h6">Order #{order.id}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            {order.username}
                        </Typography>
                    </Box>
                </Box>
                <OrderStatusChip status={order.status} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">
                    {order.Products?.length || order.items?.length || 0} items
                </Typography>
                <Typography variant="h6" color="primary">
                    {order.total?.toFixed(2) || '0.00'} ден.
                </Typography>
            </Box>

            {order.deliveryAddress && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 2 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary">
                        {order.deliveryAddress.line1}, {order.deliveryAddress.city}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
                variant="contained"
                color={actionColor}
                onClick={() => onAction(order.id)}
                fullWidth
                sx={{ fontWeight: 'medium' }}
            >
                {actionLabel}
            </Button>
        </CardContent>
    </Card>
);

// Enhanced RestaurantCard for homepage
const WoltRestaurantCard = ({ restaurant, onClick }) => (
    <Card
        sx={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            borderRadius: 3,
            overflow: 'hidden'
        }}
        onClick={() => onClick(restaurant.id)}
    >
        <Box sx={{ position: 'relative' }}>
            <CardMedia
                component="img"
                height="160"
                image={restaurant.imageUrl || 'https://via.placeholder.com/400x160?text=Restaurant'}
                alt={restaurant.name}
            />
            {!restaurant.isOpen && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Typography variant="h6" color="white" fontWeight="bold">
                        Closed
                    </Typography>
                </Box>
            )}
            <Box sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: 'white',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ color: '#ffc107', fontSize: 14 }} />
                    <Typography variant="caption" fontWeight="medium">
                        {restaurant.rating || 4.5}
                    </Typography>
                </Box>
            </Box>
        </Box>

        <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                {restaurant.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {restaurant.category}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        {restaurant.deliveryTimeEstimate || 30} min
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {restaurant.openHours || "09:00-22:00"}
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

export { OrderStatusChip, DeliveryCard, WoltRestaurantCard };