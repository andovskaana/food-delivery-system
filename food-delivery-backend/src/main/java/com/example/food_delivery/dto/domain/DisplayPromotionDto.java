package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.PromotionRequest;

import java.time.Instant;

public record DisplayPromotionDto(
        Long id,
        Long restaurantId,
        String restaurantName,
        Long productId,
        String productName,
        String scope,
        String promotionName,
        String description,
        Double discountPercent,
        Double discountAmount,
        String discountLabel,
        Instant validFrom,
        Instant validUntil
) {
    public static DisplayPromotionDto from(PromotionRequest promotion) {
        Long productId = promotion.getTargetProduct() != null ? promotion.getTargetProduct().getId() : null;
        String productName = promotion.getTargetProduct() != null ? promotion.getTargetProduct().getName() : null;
        Double percent = promotion.getDiscountPercent();
        Double amount = promotion.getDiscountAmount();

        return new DisplayPromotionDto(
                promotion.getId(),
                promotion.getRestaurant() != null ? promotion.getRestaurant().getId() : null,
                promotion.getRestaurant() != null ? promotion.getRestaurant().getName() : null,
                productId,
                productName,
                productId == null ? "RESTAURANT" : "PRODUCT",
                promotion.getPromotionName(),
                promotion.getDescription(),
                percent,
                amount,
                buildDiscountLabel(percent, amount),
                promotion.getValidFrom(),
                promotion.getValidUntil()
        );
    }

    private static String buildDiscountLabel(Double percent, Double amount) {
        if (percent != null && percent > 0) {
            double rounded = Math.round(percent * 100.0) / 100.0;
            return (rounded == Math.rint(rounded) ? String.valueOf((int) rounded) : String.valueOf(rounded)) + "% off";
        }
        if (amount != null && amount > 0) {
            double rounded = Math.round(amount * 100.0) / 100.0;
            return (rounded == Math.rint(rounded) ? String.valueOf((int) rounded) : String.valueOf(rounded)) + " ден off";
        }
        return "Special offer";
    }
}
