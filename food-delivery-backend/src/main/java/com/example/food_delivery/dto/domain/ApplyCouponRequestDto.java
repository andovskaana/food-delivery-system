package com.example.food_delivery.dto.domain;

/**
 * DTO for applying a coupon code to an order.
 */
public record ApplyCouponRequestDto(
        String couponCode
) {
}
