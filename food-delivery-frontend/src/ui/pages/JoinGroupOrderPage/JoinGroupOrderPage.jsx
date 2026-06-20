import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
    Alert as MuiAlert,
} from "@mui/material";

const JoinGroupOrderPage = () => {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        const cleanCode = code.trim().toUpperCase();

        if (!cleanCode) {
            setError("Please enter a group order code.");
            return;
        }

        navigate(`/group-orders/${cleanCode}`);
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", mt: 5, px: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        Join Group Order
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Enter the invite code shared by your friend.
                    </Typography>

                    {error && (
                        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                            {error}
                        </MuiAlert>
                    )}

                    <Stack spacing={2}>
                        <TextField
                            label="Group invite code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            fullWidth
                        />

                        <Button variant="contained" onClick={handleJoin}>
                            Join Order
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default JoinGroupOrderPage;
