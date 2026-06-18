package com.example.food_delivery.dto.domain;

/**
 * DTO representing free delivery eligibility information.
 */
public record FreeDeliveryInfoDto(
        Boolean eligible,           // Whether user is eligible for free delivery
        Boolean isFree,             // Whether delivery is currently free (VIP or threshold met)
        Double currentCartTotal,    // Current cart total
        Double thresholdAmount,     // Amount needed for free delivery (if threshold-based)
        Double amountRemaining,     // Amount remaining to reach threshold
        String message              // Display message
) {
}
