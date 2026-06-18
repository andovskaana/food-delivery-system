import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Button, CircularProgress } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios
            .get("http://localhost:8080/api/user/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setUser(res.data))
            .catch((err) => console.error(err));
    }, []);

    if (!user) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 6, px: 2 }}>
            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                }}
            >
                <CardContent sx={{ textAlign: "center", py: 5 }}>
                    {/* Greeting */}
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Hello {user.name} {user.surname}! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Welcome back to <strong>Ana2AnaFoodDelivery</strong>.
                    </Typography>

                    {/* Profile info */}
                    <Box sx={{ textAlign: "left", mb: 3 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Username:</strong> {user.username}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Email:</strong> {user.email}
                        </Typography>
                    </Box>

                    {/* Action */}
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                        onClick={() => navigate("/")}
                    >
                        Start Browsing
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProfilePage;
