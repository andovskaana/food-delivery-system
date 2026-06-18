package com.example.food_delivery.dto.domain;

import java.util.List;

/**
 * DTO representing segment-specific offers and recommendations for a customer.
 */
public record RfmSegmentOffersDto(
        String username,
        String segment,
        String segmentGoal,
        List<RfmPromotionDto> promotions,
        List<DisplayProductDto> recommendedProducts,
        List<DisplayRestaurantDto> recommendedRestaurants,
        FreeDeliveryInfoDto freeDeliveryInfo
) {
}
