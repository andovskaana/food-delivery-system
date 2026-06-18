import React, { useEffect, useState } from "react";
import {
    Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Box, Card, CardContent,
    Chip, Tooltip, Popover, List, ListItem, ListItemText, Rating, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import axiosInstance from "../../../../axios/axios.js";
import useAuth from "../../../../hooks/useAuth.js";
import Alert from "../../../../common/Alert.jsx";
import { courierRepository } from "../../../../repository/courierRepository.js";

const CourierDashboard = () => {
    const [availableOrders, setAvailableOrders] = useState([]);  // algorithm-selected
    const [myOrders, setMyOrders] = useState([]);
    const [myDeliveredOrders, setMyDeliveredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Popover
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Rating dialog
    const [ratingDialog, setRatingDialog] = useState({ open: false, orderId: null, rating: 0 });

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const handleItemsClick = (event, products) => {
        setAnchorEl(event.currentTarget);
        setSelectedProducts(products || []);
    };
    const handlePopoverClose = () => setAnchorEl(null);
    const open = Boolean(anchorEl);

    const fetchOrders = async () => {
        try {
            const [availRes, myOrdersRes, deliveredRes] = await Promise.all([
                // Only algorithm-selected orders for this courier
                axiosInstance.get("/couriers/my-available-orders"),
                axiosInstance.get("/couriers/my-orders"),
                axiosInstance.get("/couriers/my-delivered-orders"),
            ]);
            setAvailableOrders(availRes.data);
            setMyOrders(myOrdersRes.data);
            setMyDeliveredOrders(deliveredRes.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleAssign = async (orderId) => {
        try {
            await axiosInstance.post(`/couriers/assign/${orderId}`);
            await fetchOrders();
            setAlertMessage("Order accepted! Good luck with the delivery.");
            setAlertOpen(true);
        } catch (err) {
            setAlertMessage(err.response?.data?.message || "Failed to accept order (may have been taken by another courier)");
            setAlertOpen(true);
        }
    };

    const handleComplete = async (orderId) => {
        try {
            await axiosInstance.post(`/couriers/complete/${orderId}`);
            await fetchOrders();
            setAlertMessage("Delivery marked as complete!");
            setAlertOpen(true);
        } catch (err) {
            setAlertMessage("Failed to complete delivery: " + (err.response?.data?.message || err.message));
            setAlertOpen(true);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "CONFIRMED": return "primary";
            case "PICKED_UP": return "warning";
            case "DELIVERED": return "success";
            default: return "default";
        }
    };

    const TruncatedCell = ({ children, title }) => (
        <Tooltip title={title || ""}>
            <span style={{ display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {children}
            </span>
        </Tooltip>
    );

    const OrderTable = ({ orders, showComplete, showDeliveredAt }) => (
        <TableContainer component={Paper}>
            <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: "10%" }}>ID</TableCell>
                        <TableCell sx={{ width: "15%" }}>Status</TableCell>
                        <TableCell sx={{ width: "18%" }}>Restaurant</TableCell>
                        <TableCell sx={{ width: "10%" }}>Items</TableCell>
                        <TableCell sx={{ width: "17%" }}>Address</TableCell>
                        <TableCell sx={{ width: "13%" }}>Total</TableCell>
                        <TableCell sx={{ width: "17%" }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>
                                <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                            </TableCell>
                            <TableCell>
                                <TruncatedCell title={order.restaurantName}>{order.restaurantName}</TruncatedCell>
                            </TableCell>
                            <TableCell>
                                <Button variant="outlined" size="small" onClick={(e) => handleItemsClick(e, order.products)}>
                                    {order.products?.length || 0} items
                                </Button>
                            </TableCell>
                            <TableCell>
                                <TruncatedCell title={order.deliveryAddress?.line1}>{order.deliveryAddress?.line1}</TruncatedCell>
                            </TableCell>
                            <TableCell>{order.total?.toFixed(2) || "0.00"} ден.</TableCell>
                            <TableCell>
                                {showComplete && order.status === "CONFIRMED" && (
                                    <Button variant="contained" size="small" onClick={() => handleAssign(order.id)}>
                                        Accept
                                    </Button>
                                )}
                                {showComplete && order.status === "PICKED_UP" && (
                                    <Button variant="contained" color="success" size="small" onClick={() => handleComplete(order.id)}>
                                        Mark Delivered
                                    </Button>
                                )}
                                {showDeliveredAt && order.deliveredAt && (
                                    <Typography variant="caption">
                                        {new Date(order.deliveredAt).toLocaleString()}
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Courier Dashboard</Typography>

            <MuiAlert severity="info" sx={{ mb: 3 }}>
                Welcome, {user?.username}! Orders shown here were selected specifically for you by our assignment algorithm.
            </MuiAlert>

            {/* Algorithm-selected available orders */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Orders Available to You
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        These orders were matched to you by the courier assignment algorithm based on your availability and rating.
                        The first courier to accept gets the delivery.
                    </Typography>
                    {availableOrders.length === 0 ? (
                        <Typography color="text.secondary">No orders available for you right now. Check back soon.</Typography>
                    ) : (
                        <OrderTable orders={availableOrders} showComplete />
                    )}
                </CardContent>
            </Card>

            {/* Active deliveries */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 2 }}>My Active Deliveries</Typography>
                    {myOrders.filter(o => o.status !== "DELIVERED").length === 0 ? (
                        <Typography color="text.secondary">No active deliveries.</Typography>
                    ) : (
                        <OrderTable orders={myOrders.filter(o => o.status !== "DELIVERED")} showComplete />
                    )}
                </CardContent>
            </Card>

            {/* Delivered orders */}
            <Card>
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 2 }}>My Delivered Orders</Typography>
                    {myDeliveredOrders.length === 0 ? (
                        <Typography color="text.secondary">No delivered orders yet.</Typography>
                    ) : (
                        <OrderTable orders={myDeliveredOrders} showDeliveredAt />
                    )}
                </CardContent>
            </Card>

            {/* Items Popover */}
            <Popover open={open} anchorEl={anchorEl} onClose={handlePopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
                <Box sx={{ p: 2, maxWidth: 250 }}>
                    {selectedProducts.length > 0 ? (
                        <List dense>
                            {selectedProducts.map((p, i) => (
                                <ListItem key={i} disablePadding>
                                    <ListItemText primary={p.name} />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography color="text.secondary">No products</Typography>
                    )}
                </Box>
            </Popover>

            <Alert open={alertOpen} onClose={() => setAlertOpen(false)} message={alertMessage} />
        </Box>
    );
};

export default CourierDashboard;
