package com.example.food_delivery.dto.domain;

/**
 * DTO for coupon application result.
 */
public record ApplyCouponResponseDto(
        Boolean success,
        String message,
        String couponCode,
        Integer discountPercent,
        Double discountAmount,
        Double newTotal,
        Boolean freeDelivery
) {
}
