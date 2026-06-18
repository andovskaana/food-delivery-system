import axiosInstance from "../axios/axios.js";

const base = "/recommendations";

export default {
    getTimeBasedRecommendations: () => axiosInstance.get(`${base}/time-based`),
    getRecommendationsForHour: (hour) => axiosInstance.get(`${base}/time-based/${hour}`),
    getPopularRecommendations: () => axiosInstance.get(`${base}/popular`),

};