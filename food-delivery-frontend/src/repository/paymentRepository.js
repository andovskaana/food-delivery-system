import axiosInstance from "../axios/axios.js";

const base = "/payments";

const paymentRepository = {
    // Stripe intent
    createIntent: (orderId) => axiosInstance.post(`${base}/${orderId}/intent`),
    
    // cPay/CASYS-style demo payment intent (Macedonian payment)
    createCpayIntent: (orderId) => axiosInstance.post(`${base}/${orderId}/cpay-intent`),
    
    // Demo simulation
    simulateSuccess: (paymentId) => axiosInstance.post(`${base}/${paymentId}/simulate-success`),
    simulateFailure: (paymentId) => axiosInstance.post(`${base}/${paymentId}/simulate-failure`),
    
    // cPay demo callback (simulates redirect back from cPay)
    cpayCallback: (paymentId, success) =>
        axiosInstance.post(`${base}/${paymentId}/cpay-callback?success=${success}`),
    
    get: (paymentId) => axiosInstance.get(`${base}/${paymentId}`),
};

export default paymentRepository;
