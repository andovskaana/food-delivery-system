const adminBase = "/admin";
export const adminRepository = {
    // Users
    getAllUsers: () => axiosInstance.get(`${adminBase}/users`),
    updateUserRole: (username, role) => axiosInstance.put(`${adminBase}/users/${username}/role`, { role }),
    deleteUser: (username) => axiosInstance.delete(`${adminBase}/users/${username}`),

    // Restaurants
    getAllRestaurants: () => axiosInstance.get(`${adminBase}/restaurants`),

    // Products
    getAllProducts: () => axiosInstance.get(`${adminBase}/products`),
    getProductsByRestaurant: (restaurantId) => axiosInstance.get(`${adminBase}/restaurants/${restaurantId}/products`),
};