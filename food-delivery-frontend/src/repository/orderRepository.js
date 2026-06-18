import axiosInstance from "../axios/axios.js";
const base = "/orders";
export default {
  getPending: () => axiosInstance.get(`${base}/cart`),
  confirmPending: () => axiosInstance.put(`${base}/pending/confirm`),
  cancelPending: () => axiosInstance.put(`${base}/pending/cancel`),
  getConfirmed: () => axiosInstance.get(`${base}/confirmed`),
  trackOrder: (orderId) => axiosInstance.get(`${base}/track/${orderId}`),
  getMyOrders: () => axiosInstance.get(`${base}/my-orders`),
  updateAddress: (orderId, address) =>
      axiosInstance.put(`${base}/address/${orderId}`, address),
  applyCoupon: (couponCode) =>
      axiosInstance.post(`${base}/apply-coupon`, { couponCode }),
  removeCoupon: () => axiosInstance.delete(`${base}/remove-coupon`),
};
