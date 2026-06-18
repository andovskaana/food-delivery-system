import axiosInstance from "../axios/axios.js";

const courierBase = "/couriers";

export const courierRepository = {
    // Algorithm-selected orders offered to this courier
    getMyAvailableOrders: () => axiosInstance.get(`${courierBase}/my-available-orders`),
    
    // Accept an offered order (race-condition safe - only if offered by algorithm)
    assignToOrder: (orderId) => axiosInstance.post(`${courierBase}/assign/${orderId}`),
    
    completeDelivery: (orderId) => axiosInstance.post(`${courierBase}/complete/${orderId}`),
    
    getMyOrders: () => axiosInstance.get(`${courierBase}/my-orders`),
    
    getMyDeliveredOrders: () => axiosInstance.get(`${courierBase}/my-delivered-orders`),
    
    // Rate a courier (customer use)
    rateCourier: (orderId, rating) => axiosInstance.post(`${courierBase}/rate/${orderId}`, { rating }),
};

export default courierRepository;
