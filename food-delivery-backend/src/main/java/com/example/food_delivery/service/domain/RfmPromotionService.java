package com.example.food_delivery.service.domain;

import com.example.food_delivery.dto.domain.ApplyCouponResponseDto;
import com.example.food_delivery.dto.domain.FreeDeliveryInfoDto;
import com.example.food_delivery.dto.domain.RfmPromotionDto;
import com.example.food_delivery.dto.domain.RfmSegmentOffersDto;
import com.example.food_delivery.model.domain.User;

import java.util.List;

/**
 * Service interface for RFM segment-based promotions and offers.
 */
public interface RfmPromotionService {

    /**
     * Get all segment-specific offers for a user including promotions,
     * product recommendations, and restaurant recommendations.
     *
     * @param user The user to get offers for
     * @return Complete segment offers DTO
     */
    RfmSegmentOffersDto getSegmentOffers(User user);

    /**
     * Get promotions for a specific user based on their RFM segment.
     *
     * @param user The user to get promotions for
     * @return List of applicable promotions
     */
    List<RfmPromotionDto> getPromotionsForUser(User user);

    /**
     * Get free delivery information for a user based on their segment and cart.
     *
     * @param user The user
     * @param cartTotal Current cart total
     * @return Free delivery eligibility info
     */
    FreeDeliveryInfoDto getFreeDeliveryInfo(User user, Double cartTotal);

    /**
     * Check if user qualifies for free delivery based on segment.
     *
     * @param user The user
     * @return true if user gets free delivery
     */
    boolean qualifiesForFreeDelivery(User user);

    /**
     * Get discount percentage for user based on segment.
     *
     * @param user The user
     * @return Discount percentage (0-100)
     */
    int getDiscountForUser(User user);

    /**
     * Validate and get coupon discount for user.
     *
     * @param user The user
     * @param couponCode The coupon code to validate
     * @param subtotal The order subtotal
     * @return Coupon validation result with discount info
     */
    ApplyCouponResponseDto validateCoupon(User user, String couponCode, Double subtotal);
}
