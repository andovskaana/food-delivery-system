import axiosInstance from "../axios/axios.js";

const base = "/promotions";

export default {
    findActive: () => axiosInstance.get(`${base}/active`),
    findActiveByRestaurant: (restaurantId) =>
        axiosInstance.get(`${base}/active/restaurants/${restaurantId}`),
};
