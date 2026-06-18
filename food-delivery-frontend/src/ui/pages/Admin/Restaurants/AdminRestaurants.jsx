import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import restaurantRepository from "../../../../repository/restaurantRepository.js";

const AdminRestaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editing, setEditing] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let live = true;
        restaurantRepository
            .findAll()
            .then((res) => live && setRestaurants(res?.data || []))
            .catch((err) => console.error("Load restaurants failed", err))
            .finally(() => live && setLoading(false));
        return () => {
            live = false;
        };
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return restaurants;
        return restaurants.filter(
            (r) =>
                r.name?.toLowerCase().includes(s) ||
                r.description?.toLowerCase().includes(s)
        );
    }, [restaurants, q]);

    const validate = (restaurant) => {
        const newErrors = {};
        if (!restaurant.name?.trim()) newErrors.name = "Name is required";
        if (!restaurant.deliveryTimeEstimate || restaurant.deliveryTimeEstimate <= 0)
            newErrors.deliveryTimeEstimate = "Delivery time must be greater than 0";
        return newErrors;
    };

    const onAdd = () => {
        setEditing({
            name: "",
            description: "",
            openHours: "",
            imageUrl: "",
            averageRating: 4.5,
            deliveryTimeEstimate: 30,
            isOpen: true,
        });
        setErrors({});
        setOpenDialog(true);
    };

    const onEdit = (r) => {
        setEditing({ ...r });
        setErrors({});
        setOpenDialog(true);
    };

    const onDelete = async (r) => {
        const ok = window.confirm(`Delete "${r.name}"?`);
        if (!ok) return;
        try {
            await restaurantRepository.remove(r.id);
            setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleSave = async () => {
        const validationErrors = validate(editing);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            if (editing?.id) {
                const res = await restaurantRepository.edit(editing.id, editing);
                setRestaurants((prev) =>
                    prev.map((x) => (x.id === editing.id ? res.data : x))
                );
            } else {
                const res = await restaurantRepository.add(editing);
                setRestaurants((prev) => [...prev, res.data]);
            }
            setOpenDialog(false);
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    // Function to check if restaurant is open based on openHours (supports overnight)
    const isRestaurantOpen = (r) => {
        if (!r.openHours) return r.isOpen; // fallback

        try {
            const [start, end] = r.openHours.split("-").map((s) => s.trim());
            if (!start || !end) return r.isOpen;

            const now = new Date();
            const [startH, startM] = start.split(":").map(Number);
            const [endH, endM] = end.split(":").map(Number);

            const startMinutes = startH * 60 + (startM || 0);
            const endMinutes = endH * 60 + (endM || 0);
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            if (startMinutes < endMinutes) {
                // same-day hours
                return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
            } else {
                // overnight hours (e.g., 22:00-02:00)
                return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
            }
        } catch (e) {
            console.error("Invalid openHours format:", r.openHours, e);
            return r.isOpen;
        }
    };

    return (
        <Box>
            {/* Toolbar: title, search, add */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 3,
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 800, mr: "auto" }}>
                    Restaurant Management
                </Typography>

                <TextField
                    placeholder="Search restaurants…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    sx={{
                        width: { xs: "100%", sm: 320, md: 380 },
                        background: "#fff",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <Button
                onClick={onAdd}
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2, fontWeight: 700, marginBottom: 3 }}
            >
                Add Restaurant
            </Button>

            {/* Table */}
            {loading ? (
                <Typography>Loading…</Typography>
            ) : (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <Table sx={{ minWidth: 960 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Open Hours</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Delivery Time</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((r) => (
                                <TableRow key={r.id} hover>
                                    <TableCell sx={{ width: 260 }}>
                                        <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {r.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{r.openHours}</TableCell>
                                    <TableCell>{r.deliveryTimeEstimate ?? 30} min</TableCell>
                                    <TableCell>{r.averageRating ?? 4.5}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color={isRestaurantOpen(r) ? "success" : "default"}
                                            label={isRestaurantOpen(r) ? "Open" : "Closed"}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEdit(r)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => onDelete(r)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filtered.length && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography color="text.secondary">
                                            No restaurants match your search.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editing?.id ? "Edit Restaurant" : "Add Restaurant"}
                </DialogTitle>
                <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
                    <TextField
                        label="Name"
                        value={editing?.name || ""}
                        onChange={(e) =>
                            setEditing({ ...editing, name: e.target.value })
                        }
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Description"
                        value={editing?.description || ""}
                        onChange={(e) =>
                            setEditing({ ...editing, description: e.target.value })
                        }
                        multiline
                        rows={2}
                    />
                    <TextField
                        label="Open hours"
                        value={editing?.openHours || ""}
                        onChange={(e) =>
                            setEditing({ ...editing, openHours: e.target.value })
                        }
                    />
                    <TextField
                        label="Average rating"
                        value={editing?.averageRating || ""}
                        onChange={(e) =>
                            setEditing({ ...editing, averageRating: e.target.value })
                        }
                    />
                    <TextField
                        label="Image URL"
                        value={editing?.imageUrl || ""}
                        onChange={(e) =>
                            setEditing({ ...editing, imageUrl: e.target.value })
                        }
                    />
                    <TextField
                        label="Delivery Time (minutes)"
                        type="number"
                        value={editing?.deliveryTimeEstimate || ""}
                        onChange={(e) =>
                            setEditing({
                                ...editing,
                                deliveryTimeEstimate: e.target.value,
                            })
                        }
                        error={!!errors.deliveryTimeEstimate}
                        helperText={errors.deliveryTimeEstimate}
                    />
                    <TextField
                        select
                        label="Status"
                        value={editing?.isOpen ? "open" : "closed"}
                        onChange={(e) =>
                            setEditing({
                                ...editing,
                                isOpen: e.target.value === "open",
                            })
                        }
                    >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminRestaurants;
