import React from "react";
import { Box, Paper } from "@mui/material";
import "./auth.css";

const AuthLayout = ({ children }) => {
    return (
        <Box className="auth-root">
            {/* Left column / mobile background */}
            <Box className="auth-illustration" />

            {/* Right column (desktop) / centered overlay (mobile) */}
            <Box className="auth-form-wrap">
                <Paper elevation={4} className="auth-card">
                    {children}
                </Paper>
            </Box>
        </Box>
    );
};

export default AuthLayout;