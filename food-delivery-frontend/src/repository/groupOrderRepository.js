import axiosInstance from "../axios/axios.js";

const base = "/group-orders";

export default {
    createGroupOrder: (splitCount, splitType = "EQUAL") =>
        axiosInstance.post(base, { splitCount, splitType }),

    getMyGroups: () =>
        axiosInstance.get(`${base}/my`),

    getMyActiveGroups: () =>
        axiosInstance.get(`${base}/my-active`),

    getGroupOrder: (code) =>
        axiosInstance.get(`${base}/${code}`),

    joinGroupOrder: (code, displayName, email) =>
        axiosInstance.post(`${base}/${code}/join`, { displayName, email }),

    updateSplitCount: (code, splitCount) =>
        axiosInstance.put(`${base}/${code}/split-count`, { splitCount }),

    assignItems: (code, orderItemIds) =>
        axiosInstance.put(`${base}/${code}/items`, { orderItemIds }),

    leaveGroupOrder: (code) =>
        axiosInstance.post(`${base}/${code}/leave`),

    getParticipant: (paymentToken) =>
        axiosInstance.get(`${base}/participant/${paymentToken}`),

    payParticipant: (paymentToken, success = true) =>
        axiosInstance.post(`${base}/participant/${paymentToken}/pay`, null, {
            params: { success },
        }),

    getStatus: (code) =>
        axiosInstance.get(`${base}/${code}/status`),

    cancelGroupOrder: (code) =>
        axiosInstance.post(`${base}/${code}/cancel`),
};
