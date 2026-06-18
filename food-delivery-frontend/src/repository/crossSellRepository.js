import axiosInstance from "../axios/axios.js";

const base = "/recommendations";

/**
 * Fetch cross-sell recommendations based on cart contents
 *
 * @param {number[]} productIds
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getCrossSellRecommendations = (productIds, limit = 5) => {
    if (!productIds || productIds.length === 0) {
        return Promise.resolve([]);
    }

    return axiosInstance.get(`${base}/cross-sell`, {
        params: {
            productIds,
            limit,
        },
    });
};

export default {
    getCrossSellRecommendations,
};
