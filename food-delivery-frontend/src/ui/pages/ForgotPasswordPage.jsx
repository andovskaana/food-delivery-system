import React, { useState } from "react";
import { Box, Button, TextField, Typography, Avatar, Link, Snackbar, Alert } from "@mui/material";
import { LocalDining } from "@mui/icons-material";
import { useNavigate } from "react-router";
import userRepository from "../../repository/userRepository.js";
import AuthLayout from "../components/Auth/AuthLayout.jsx";

const ForgotPasswordPage = () => {
    const [form, setForm] = useState({ username: "", password: "", repeatPassword: "" });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();

        if (!form.username.trim()) {
            setSnackbar({ open: true, message: "Username is required!", severity: "error" });
            return;
        }

        if (form.password !== form.repeatPassword) {
            setSnackbar({ open: true, message: "Passwords do not match!", severity: "error" });
            return;
        }

        try {
            await userRepository.changePassword(form.username, form.password);
            setSnackbar({ open: true, message: "Password changed successfully!", severity: "success" });

            // Optional: redirect after 2 seconds
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 2000);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Password change failed.";
            setSnackbar({ open: true, message: msg, severity: "error" });
        }
    };

    return (
        <AuthLayout>
            <Box
                component="form"
                onSubmit={submit}
                sx={{
                    maxWidth: 360,
                    width: "95%",
                    mx: "auto",
                    my: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                {/* Brand */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Avatar sx={{ bgcolor: "#f97316", width: 32, height: 32 }}>
                        <LocalDining fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Ana2AnaFoodDelivery
                    </Typography>
                </Box>

                {/* Titles */}
                <Typography variant="h5" className="auth-title">Change Password</Typography>
                <Typography className="auth-subtitle" sx={{ mb: 1 }}>
                    Enter your username and new password
                </Typography>

                {/* Form fields */}
                <TextField
                    label="Username"
                    fullWidth
                    size="small"
                    margin="dense"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                />
                <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    size="small"
                    margin="dense"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <TextField
                    label="Repeat Password"
                    type="password"
                    fullWidth
                    size="small"
                    margin="dense"
                    value={form.repeatPassword}
                    onChange={(e) => setForm({ ...form, repeatPassword: e.target.value })}
                    required
                />

                {/* Submit */}
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 1, width: "100%", fontWeight: 600 }}
                >
                    Change Password
                </Button>

                {/* Sign in link */}
                <Box sx={{ fontSize: "0.85rem", textAlign: "center", mt: 1, fontWeight: 600 }} className="auth-footer">
                    <span>Remembered your password? </span>
                    <Link component="button" onClick={() => navigate("/login")}>
                        Sign in
                    </Link>
                </Box>
            </Box>

            {/* Snackbar for messages */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
