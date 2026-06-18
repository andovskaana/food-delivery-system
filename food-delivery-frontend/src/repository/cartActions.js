import productRepository from "./productRepository.js";
import orderRepository from "./orderRepository.js";

const isSingleRestaurantError = (err) => {
    const status = err?.response?.status;
    const text =
        err?.response?.data && typeof err.response.data === "string"
            ? err.response.data
            : "";
    const msg = err?.response?.data?.message || err?.message || "";
    return (
        status === 409 ||
        text.includes("Cart can contain Products from only one restaurant") ||
        msg.includes("Cart can contain Products from only one restaurant")
    );
};

export async function addToCartRespectingSingleRestaurant(
    productId,
    confirmFn = (m) => window.confirm(m)
) {
    try {
        await productRepository.addToOrder(productId);
        return { ok: true, replaced: false };
    } catch (err) {
        if (isSingleRestaurantError(err)) {
            const proceed = await confirmFn(
                "Your cart has items from another restaurant. Clear cart and add this item?"
            );
            if (proceed) {
                await orderRepository.cancelPending();
                await productRepository.addToOrder(productId);
                return { ok: true, replaced: true };
            }
            return { ok: false, replaced: false, cancelled: true };
        }
        throw err;
    }
}