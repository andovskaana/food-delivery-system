import axiosInstance from "../axios/axios.js";
const base = "/products";
export default {
  findAll: () => axiosInstance.get(base),
  findById: (id) => axiosInstance.get(`${base}/${id}`),
  findDetails: (id) => axiosInstance.get(`${base}/details/${id}`),
  add: (data) => axiosInstance.post(`${base}/add`, data),
  edit: (id, data) => axiosInstance.put(`${base}/edit/${id}`, data),
  remove: (id) => axiosInstance.delete(`${base}/delete/${id}`),
  addToOrder: (id) => axiosInstance.post(`${base}/add-to-order/${id}`),
  removeFromOrder: (id) => axiosInstance.post(`${base}/remove-from-order/${id}`),
};
