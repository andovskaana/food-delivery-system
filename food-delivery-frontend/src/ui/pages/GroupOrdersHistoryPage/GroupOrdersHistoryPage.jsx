import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import groupOrderRepository from "../../../repository/groupOrderRepository.js";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Stack,
    Grid,
    Alert as MuiAlert,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

const GroupOrdersHistoryPage = () => {
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        groupOrderRepository.getMyGroups()
            .then((res) => setGroups(res.data || []))
            .catch((e) => setError(e?.response?.data?.message || e?.response?.data || "Failed to load group orders"));
    }, []);

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <GroupAddIcon color="primary" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>My Group Orders</Typography>
            </Box>

            {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

            {groups.length === 0 ? (
                <Typography color="text.secondary">Groups you create or join will appear here.</Typography>
            ) : (
                <Grid container spacing={3}>
                    {groups.map((group) => (
                        <Grid item xs={12} sm={6} md={4} key={group.groupCode}>
                            <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Code {group.groupCode}</Typography>
                                        <Chip size="small" label={group.status} color={group.status === "FULLY_PAID" ? "success" : group.status === "CANCELLED" ? "warning" : "primary"} />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Type: <strong>{group.splitType === "ITEMS" ? "Split by items" : "Equal split"}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Participants: <strong>{group.joinedParticipantsCount}/{group.splitCount}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Paid: <strong>{Number(group.paidAmount || 0).toFixed(2)} / {Number(group.totalAmount || 0).toFixed(2)} ден.</strong>
                                    </Typography>
                                    {group.createdAt && (
                                        <Typography variant="body2" color="text.secondary">
                                            Created: <strong>{new Date(group.createdAt).toLocaleString()}</strong>
                                        </Typography>
                                    )}
                                    {group.currentUserParticipantId && group.currentUserPaymentLink && group.status !== "FULLY_PAID" && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                            You are joined in this group.
                                        </Typography>
                                    )}
                                    <Button sx={{ mt: 2 }} fullWidth variant="contained" onClick={() => navigate(`/group-orders/${group.groupCode}`)}>
                                        Open Group
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default GroupOrdersHistoryPage;
