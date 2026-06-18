import React, {useEffect, useState} from 'react';
import {
    Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Box, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton, Stack
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axiosInstance from "../../../../axios/axios.js";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editUser, setEditUser] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        password: '',
        role: 'ROLE_CUSTOMER'
    });

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get('user/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditUser = (user) => {
        setEditUser({...user});
        setEditDialogOpen(true);
    };

    const handleSaveUser = async () => {
        try {
            await axiosInstance.put(`/user/edit/${editUser.username}`, editUser);
            await fetchUsers();
            setEditDialogOpen(false);
            setEditUser(null);
            alert('User updated successfully!');
        } catch (err) {
            alert('Failed to update user: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

        try {
            await axiosInstance.delete(`/user/delete/${username}`);
            await fetchUsers();
            alert('User deleted successfully!');
        } catch (err) {
            alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddUser = async () => {
        try {
            await axiosInstance.post(`/user/add`, newUser);
            await fetchUsers();
            setAddDialogOpen(false);
            setNewUser({
                username: '',
                name: '',
                surname: '',
                email: '',
                phone: '',
                password: '',
                role: 'ROLE_CUSTOMER'
            });
            alert('User added successfully!');
        } catch (err) {
            alert('Failed to add user: ' + (err.response?.data?.message || err.message));
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ROLE_ADMIN': return 'error';
            case 'ROLE_COURIER': return 'warning';
            case 'ROLE_CUSTOMER': return 'info';
            default: return 'default';
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4">User Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialogOpen(true)}
                >
                    Add User
                </Button>
            </Stack>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.username}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.name} {user.surname}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role.replace('ROLE_', '')}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEditUser(user)}
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteUser(user.username)}
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                        <TextField label="Username" value={editUser?.username || ''} disabled />
                        <TextField
                            label="Name"
                            value={editUser?.name || ''}
                            onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                        />
                        <TextField
                            label="Surname"
                            value={editUser?.surname || ''}
                            onChange={(e) => setEditUser({...editUser, surname: e.target.value})}
                        />
                        <TextField
                            label="Email"
                            value={editUser?.email || ''}
                            onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                        />
                        <TextField
                            label="Phone number"
                            value={editUser?.phone || ''}
                            onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                        />
                        <TextField
                            select
                            label="Role"
                            value={editUser?.role || ''}
                            onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                        >
                            <MenuItem value="ROLE_CUSTOMER">Customer</MenuItem>
                            <MenuItem value="ROLE_COURIER">Courier</MenuItem>
                            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveUser} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                        <TextField
                            label="Username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        />
                        <TextField
                            label="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                        <TextField
                            label="Surname"
                            value={newUser.surname}
                            onChange={(e) => setNewUser({...newUser, surname: e.target.value})}
                        />
                        <TextField
                            label="Phone number"
                            value={newUser.phone}
                            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        />
                        <TextField
                            label="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        />
                        <TextField
                            select
                            label="Role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        >
                            <MenuItem value="ROLE_CUSTOMER">Customer</MenuItem>
                            <MenuItem value="ROLE_COURIER">Courier</MenuItem>
                            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminUsers;
