import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { Link, useNavigate, useLocation } from "react-router";
import useAuth from "../../../../hooks/useAuth.js";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const hideHeader = /^\/(login|register)(\/|$)/.test(location.pathname);
    if (hideHeader) return null;

    const getDashboardLink = () => {
        if (!user) return null;

        if (user.roles?.includes('ADMIN')) {
            return (
                <>
                    <Button color="inherit" startIcon={<AdminPanelSettingsIcon />} component={Link} to="/admin">
                        Admin Panel
                    </Button>
                    <Button color="inherit" startIcon={<DeliveryDiningIcon />} component={Link} to="/admin/couriers">
                        Courier Audit
                    </Button>
                </>
            );
        }

        if (user.roles?.includes('RESTAURANT_OWNER')) {
            return (
                <Button color="inherit" startIcon={<StorefrontIcon />} component={Link} to="/owner">
                    Owner Panel
                </Button>
            );
        }

        if (user.roles?.includes('COURIER')) {
            return (
                <Button color="inherit" startIcon={<DeliveryDiningIcon />} component={Link} to="/courier">
                    Courier Dashboard
                </Button>
            );
        }

        return null;
    };

    return (
        <AppBar position="static" color="primary">
            <Toolbar sx={{ display: 'flex', gap: 2 }}>
                <RestaurantIcon />

                <Typography
                    variant="h6"
                    sx={{ flexGrow: 1 }}
                    component={Link}
                    to="/"
                    style={{ color: "#fff", textDecoration: "none" }}
                >
                    Ana2AnaFoodDelivery
                </Typography>

                {user?.roles?.includes('CUSTOMER') && (
                    <>
                        <Button color="inherit" startIcon={<ShoppingCartIcon />} component={Link} to="/cart">
                            Cart
                        </Button>
                        <Button color="inherit" startIcon={<GroupAddIcon />} component={Link} to="/group-orders/join">
                            Join Group
                        </Button>
                        <Button color="inherit" component={Link} to="/group-orders/my-groups">
                            My Groups
                        </Button>
                        <Button color="inherit" component={Link} to="/orders/my-orders">
                            My Orders
                        </Button>
                        <Button color="inherit" component={Link} to="/recommendations">
                            Recommendations
                        </Button>
                    </>
                )}

                {getDashboardLink()}

                {user ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button color="inherit" onClick={() => navigate('/user/me')} sx={{ textTransform: 'none' }}>
                            Hello, {user.username}
                        </Button>
                        <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>
                            Logout
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
