package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.OwnerChangeRequest;
import com.example.food_delivery.model.domain.PromotionRequest;
import com.example.food_delivery.model.domain.Restaurant;

import java.util.List;

public interface RestaurantOwnerService {
    /** Returns restaurants owned by this user */
    List<Restaurant> getOwnedRestaurants(String username);

    /** Submit a change request (restaurant/product update) */
    OwnerChangeRequest submitChangeRequest(String username, Long restaurantId, String type, String payload);

    /** Submit a promotion request */
    PromotionRequest submitPromotion(String username, PromotionRequest request);

    /** Admin: get all pending requests */
    List<OwnerChangeRequest> getPendingChangeRequests();

    /** Admin: approve a change request and apply it */
    OwnerChangeRequest approveChangeRequest(Long requestId, String adminUsername);

    /** Admin: reject a change request */
    OwnerChangeRequest rejectChangeRequest(Long requestId, String adminUsername, String reason);

    /** Admin: get all pending promotions */
    List<PromotionRequest> getPendingPromotions();

    /** Admin: approve a promotion */
    PromotionRequest approvePromotion(Long promotionId, String adminUsername);

    /** Admin: reject a promotion */
    PromotionRequest rejectPromotion(Long promotionId, String adminUsername, String reason);

    /** Check if a user owns a specific restaurant */
    boolean ownsRestaurant(String username, Long restaurantId);
}
