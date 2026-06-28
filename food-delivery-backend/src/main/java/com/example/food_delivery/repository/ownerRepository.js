import axiosInstance from "../axios/axios.js";

const base = "/owner";
const adminBase = "/admin/owner-requests";

export const ownerRepository = {
    getMyRestaurants: () => axiosInstance.get(`${base}/my-restaurants`),

    getRestaurantProducts: (restaurantId) =>
        axiosInstance.get(`${base}/restaurants/${restaurantId}/products`),

    editProduct: (restaurantId, productId, payload) =>
        axiosInstance.put(`${base}/restaurants/${restaurantId}/products/${productId}`, payload),

    deleteProduct: (restaurantId, productId) =>
        axiosInstance.delete(`${base}/restaurants/${restaurantId}/products/${productId}`),

    submitRestaurantChangeRequest: (restaurantId, payload) =>
        axiosInstance.post(`${base}/restaurants/${restaurantId}/change-request`, payload),

    submitProductAddRequest: (restaurantId, payload) =>
        axiosInstance.post(`${base}/restaurants/${restaurantId}/products/add-request`, payload),

    submitProductEditRequest: (restaurantId, productId, payload) =>
        axiosInstance.post(`${base}/restaurants/${restaurantId}/products/${productId}/edit-request`, payload),

    submitProductDeleteRequest: (restaurantId, productId) =>
        axiosInstance.delete(`${base}/restaurants/${restaurantId}/products/${productId}/delete-request`),

    getMyChangeRequests: () => axiosInstance.get(`${base}/my-change-requests`),

    submitPromotion: (restaurantId, promotionData) =>
        axiosInstance.post(`${base}/restaurants/${restaurantId}/promotions`, promotionData),

    getMyPromotions: () => axiosInstance.get(`${base}/promotions`),

    getMyOrders: () => axiosInstance.get(`${base}/orders`),

    getAnalytics: (restaurantId) => axiosInstance.get(`${base}/analytics/${restaurantId}`),

    importMenuCsv: (restaurantId, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return axiosInstance.post(`${base}/restaurants/${restaurantId}/import-menu`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getPendingChanges: () => axiosInstance.get(`${adminBase}/changes/pending`),
    approveChange: (id) => axiosInstance.post(`${adminBase}/changes/${id}/approve`),
    rejectChange: (id, reason) => axiosInstance.post(`${adminBase}/changes/${id}/reject`, { reason }),

    getPendingPromotions: () => axiosInstance.get(`${adminBase}/promotions/pending`),
    approvePromotion: (id) => axiosInstance.post(`${adminBase}/promotions/${id}/approve`),
    rejectPromotion: (id, reason) => axiosInstance.post(`${adminBase}/promotions/${id}/reject`, { reason }),
};

export default ownerRepository;
