import axiosInstance from "../axios/axios.js";
const base = "/restaurants";
export default {
  findAll: () => axiosInstance.get(base),
  findById: (id) => axiosInstance.get(`${base}/${id}`),
  add: (data) => axiosInstance.post(`${base}/add`, data),
  edit: (id, data) => axiosInstance.put(`${base}/edit/${id}`, data),
  remove: (id) => axiosInstance.delete(`${base}/delete/${id}`),
  findByCategory: (category) => axiosInstance.get(`${base}?category=${category}`),
};
