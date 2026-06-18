import axiosInstance from "../axios/axios.js";

const base = "/sentiment";

export default {
    get: (id) => axiosInstance.get(`${base}/${id}`), // returns NUMBER (Double)
    getAll: () => axiosInstance.get(base),
};
