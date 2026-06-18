import axiosInstance from "../axios/axios.js";

const base = "/rfm";

export default {
    // Get user's RFM profile
    getMyRfm: () => axiosInstance.get(`${base}/me`),

    // Get all segment-specific offers (promotions + recommendations)
    getMyOffers: () => axiosInstance.get(`${base}/offers`),

    // Get promotions for the authenticated user
    getMyPromotions: () => axiosInstance.get(`${base}/promotions`),

    // Get free delivery eligibility info
    getFreeDeliveryInfo: (cartTotal = 0) =>
        axiosInstance.get(`${base}/free-delivery`, { params: { cartTotal } }),

    // Get discount percentage for user
    getMyDiscount: () => axiosInstance.get(`${base}/discount`),

    // Admin endpoints
    runAnalysis: (daysBack = 365) =>
        axiosInstance.post(`${base}/analyze`, null, { params: { daysBack } }),

    getAllCustomers: () => axiosInstance.get(`${base}/customers`),

    getSegmentSummary: () => axiosInstance.get(`${base}/segments`),

    getCustomersBySegment: (segmentName) =>
        axiosInstance.get(`${base}/segment/${encodeURIComponent(segmentName)}`),
};
