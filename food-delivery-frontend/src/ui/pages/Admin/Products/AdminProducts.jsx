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
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import productRepository from "../../../../repository/productRepository.js";
import restaurantRepository from "../../../../repository/restaurantRepository.js";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantId, setRestaurantId] = useState("");
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let live = true;
        Promise.all([
            productRepository.findAll(),
            restaurantRepository.findAll(),
        ])
            .then(([p, r]) => {
                if (!live) return;
                setProducts(p?.data || []);
                setRestaurants(r?.data || []);
            })
            .catch((err) => console.error("Load failed", err))
            .finally(() => live && setLoading(false));
        return () => {
            live = false;
        };
    }, []);

    const filtered = useMemo(() => {
        let list = products;
        if (restaurantId) {
            list = list.filter(
                (p) => String(p.restaurantId) === String(restaurantId)
            );
        }
        const s = q.trim().toLowerCase();
        if (s) {
            list = list.filter(
                (p) =>
                    p.name?.toLowerCase().includes(s) ||
                    p.description?.toLowerCase().includes(s) ||
                    p.category?.toLowerCase().includes(s)
            );
        }
        return list;
    }, [products, restaurantId, q]);

    const onAdd = () => {
        setEditingProduct({
            name: "",
            description: "",
            category: "",
            price: "",
            quantity: "",
            restaurantId: "",
            isAvailable: true,
        });
        setErrors({});
        setOpenDialog(true);
    };

    const onEdit = (p) => {
        setEditingProduct({ ...p });
        setErrors({});
        setOpenDialog(true);
    };

    const onDelete = async (p) => {
        const ok = window.confirm(`Delete "${p.name}"?`);
        if (!ok) return;
        try {
            await productRepository.remove(p.id);
            setProducts((prev) => prev.filter((x) => x.id !== p.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const validate = (product) => {
        const newErrors = {};
        if (!product.name?.trim()) newErrors.name = "Name is required";
        if (!product.price || Number(product.price) <= 0)
            newErrors.price = "Price must be greater than 0";
        if (product.quantity === "" || Number(product.quantity) < 0)
            newErrors.quantity = "Quantity cannot be negative";
        if (!product.restaurantId)
            newErrors.restaurantId = "Restaurant is required";
        return newErrors;
    };

    const handleSave = async () => {
        const validationErrors = validate(editingProduct);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            if (editingProduct?.id) {
                const res = await productRepository.edit(
                    editingProduct.id,
                    editingProduct
                );
                setProducts((prev) =>
                    prev.map((x) =>
                        x.id === editingProduct.id ? res.data : x
                    )
                );
            } else {
                const res = await productRepository.add(editingProduct);
                setProducts((prev) => [...prev, res.data]);
            }
            setOpenDialog(false);
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    return (
        <Box>
            {/* Toolbar: title, filter, search, add */}
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
                    Product Management
                </Typography>

                <Box sx={{ display: "grid", gap: 1 }}>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                        Filter by Restaurant
                    </Typography>
                    <TextField
                        select
                        value={restaurantId}
                        onChange={(e) => setRestaurantId(e.target.value)}
                        placeholder="All restaurants"
                        sx={{
                            minWidth: { xs: "100%", sm: 260 },
                            background: "#fff",
                            borderRadius: 2,
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                        }}
                    >
                        <MenuItem value="">All restaurants</MenuItem>
                        {restaurants.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                                {r.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <TextField
                    placeholder="Search products…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    sx={{
                        width: { xs: "100%", sm: 320, md: 380 },
                        background: "#fff",
                        borderRadius: 2,
                        marginTop: 3.5,
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

                <Button
                    onClick={onAdd}
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    Add Product
                </Button>
            </Box>

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
                                <TableCell sx={{ fontWeight: 700 }}>Restaurant</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Available</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((p) => (
                                <TableRow key={p.id} hover>
                                    <TableCell sx={{ width: 320 }}>
                                        <Box sx={{ display: "grid" }}>
                                            <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.description}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {
                                            restaurants.find(
                                                (r) => String(r.id) === String(p.restaurantId)
                                            )?.name
                                        }
                                    </TableCell>
                                    <TableCell sx={{ width: 200 }}>{p.category}</TableCell>
                                    <TableCell sx={{ width: 150 }}>{Number(p.price ?? 0).toFixed(2)} ден.</TableCell>
                                    <TableCell>{p.quantity ?? 0}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color={p.isAvailable ? "success" : "default"}
                                            label={p.isAvailable ? "Yes" : "No"}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEdit(p)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => onDelete(p)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filtered.length && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography color="text.secondary">
                                            No products match your filters.
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
                    {editingProduct?.id ? "Edit Product" : "Add Product"}
                </DialogTitle>
                <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
                    <TextField
                        label="Name"
                        value={editingProduct?.name || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                name: e.target.value,
                            })
                        }
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Description"
                        value={editingProduct?.description || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                description: e.target.value,
                            })
                        }
                    />
                    <TextField
                        label="Category"
                        value={editingProduct?.category || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                category: e.target.value,
                            })
                        }
                    />
                    <TextField
                        label="Price"
                        type="number"
                        value={editingProduct?.price || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                price: e.target.value,
                            })
                        }
                        error={!!errors.price}
                        helperText={errors.price}
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        value={editingProduct?.quantity || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                quantity: e.target.value,
                            })
                        }
                        error={!!errors.quantity}
                        helperText={errors.quantity}
                    />
                    <TextField
                        select
                        label="Restaurant"
                        value={editingProduct?.restaurantId || ""}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                restaurantId: e.target.value,
                            })
                        }
                        error={!!errors.restaurantId}
                        helperText={errors.restaurantId}
                    >
                        {restaurants.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                                {r.name}
                            </MenuItem>
                        ))}
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

export default AdminProducts;
