import React from 'react';
import { Box, Container } from "@mui/material";
import Header from "../Header/Header.jsx";
import { Outlet, useLocation } from "react-router";
import "./Layout.css";
import Footer from "../Footer/Footer.jsx";

const Layout = () => {
    const location = useLocation();

    // Paths where footer should NOT appear
    const noFooterPaths = [
        "/login",
        "/register",
        "/admin",
        "/courier",
        "/user/me",
        "/forgot-password"
    ];

    // check if current path starts with any of the noFooterPaths
    const hideFooter = noFooterPaths.some(path =>
        location.pathname.startsWith(path)
    );

    return (
        <Box className="layout-box">
            <Header />
            <Container className="outlet-container" sx={{ my: 2 }} maxWidth="lg">
                <Outlet />
            </Container>
            {!hideFooter && <Footer />}
        </Box>
    );
};

export default Layout;
