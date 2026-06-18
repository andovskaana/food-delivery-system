package com.example.food_delivery.dto.domain;

/**
 * DTO representing a promotion/offer based on customer's RFM segment.
 */
public record RfmPromotionDto(
        String type,              // DISCOUNT, FREE_DELIVERY, THRESHOLD_DELIVERY, COUPON
        String title,             // Display title
        String description,       // Detailed description
        Integer discountPercent,  // Discount percentage (if applicable)
        Double thresholdAmount,   // Minimum amount for threshold offers
        String couponCode,        // Coupon code (if applicable)
        String expiresAt,         // Expiration date/time
        String badgeColor,        // UI badge color (hex)
        String badgeIcon          // Icon name for UI
) {
}
