import React, { useEffect, useState } from 'react';
import { useParams } from "react-router";
import {
    Typography, Card, CardContent, Box, Stepper, Step, StepLabel,
    Chip, Divider, LinearProgress
} from "@mui/material";
import axiosInstance from "../../../axios/axios.js";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        'Order Confirmed',
        'Restaurant Accepted',
        'Preparing Food',
        'Ready for Pickup',
        'Out for Delivery',
        'Delivered'
    ];

    const fetchOrder = async () => {
        try {
            const response = await axiosInstance.get(`/orders/track/${orderId}`);
            setOrder(response.data);

            // Update step based on backend status
            switch (response.data.status) {
                case 'PICKED_UP':
                    setCurrentStep(4); // Out for Delivery
                    localStorage.setItem(`orderStep-${orderId}`, 4);
                    break;
                case 'DELIVERED':
                    setCurrentStep(5); // Delivered
                    localStorage.setItem(`orderStep-${orderId}`, 5);
                    break;
                default:
                    break;
            }

        } catch (err) {
            console.error('Error fetching order:', err);
        } finally {
            setLoading(false);
        }
    };

    // Read current step from localStorage for fake progress
    useEffect(() => {
        const storedStep = parseInt(localStorage.getItem(`orderStep-${orderId}`), 10);
        if (!isNaN(storedStep)) {
            setCurrentStep(storedStep);
        }
    }, [orderId]);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
    }, [orderId]);

    // Fake progress simulation up to "Ready for Pickup" (index 3)
    useEffect(() => {
        if (!order) return;

        if (order.status === 'PICKED_UP' || order.status === 'DELIVERED') return;

        const progressInterval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < 3) { // Stop at "Ready for Pickup"
                    const nextStep = prev + 1;
                    localStorage.setItem(`orderStep-${orderId}`, nextStep);
                    return nextStep;
                }
                return prev;
            });
        }, 10000); // 10s per step

        return () => clearInterval(progressInterval);
    }, [order, orderId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'info';
            case 'PICKED_UP':
            case 'EN_ROUTE': return 'warning';
            case 'DELIVERED': return 'success';
            default: return 'default';
        }
    };

    if (loading) return <LinearProgress />;
    if (!order) return <Typography>Order not found.</Typography>;

    return (
        <Box>
            <Typography variant="h4"  sx={{
                fontWeight: 800,
                lineHeight: 1.15,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                mb: 3,
            }}>
                Track Order #{order.id}
            </Typography>

            {/* Order Status */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h6">Order Status</Typography>
                        <Chip
                            label={order.status.replace(/_/g, ' ')}
                            color={getStatusColor(order.status)}
                            icon={order.status === 'DELIVERED' ? <CheckCircleIcon /> : <LocalShippingIcon />}
                        />
                    </Box>

                    <Stepper activeStep={currentStep} alternativeLabel>
                        {steps.map((label, index) => (
                            <Step key={label} completed={index < currentStep}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            {/* Courier Information */}
            {order.courier && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon /> Your Courier
                        </Typography>
                        <Typography variant="body1">
                            <strong>Name:</strong> {order.courier.name}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Phone:</strong> {order.courier.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Your courier is {order.courier.active ? 'available' : 'currently delivering your order'}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Order Details */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Order Details
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Order placed: {order.placedAt ? new Date(order.placedAt).toLocaleString() : 'N/A'}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Restaurant:</Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>{order.restaurantName}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Items:</Typography>
                    {order.products?.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>{item.name}</Typography>
                            <Typography>{item.price?.toFixed(2)}ден.</Typography>
                        </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Platform fee</Typography>
                        <Typography>{order.platformFee}ден.</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6">{order.total?.toFixed(2) || '0.00'}ден.</Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default TrackOrderPage;
