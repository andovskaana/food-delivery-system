import axiosInstance from "../axios/axios.js";
const base = "/reviews";
export default {
  list: (restaurantId) => axiosInstance.get(`${base}/${restaurantId}`),
  add: (restaurantId, {rating, comment}) => axiosInstance.post(`${base}/${restaurantId}?rating=${rating}` + (comment ? `&comment=${encodeURIComponent(comment)}` : "")),
};
