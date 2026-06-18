package com.example.food_delivery.dto.owner;

import com.example.food_delivery.model.domain.PromotionRequest;
import com.example.food_delivery.model.enums.ChangeRequestStatus;

import java.time.Instant;

public record PromotionRequestDto(
        Long id,
        String requesterUsername,
        Long restaurantId,
        String restaurantName,
        Long productId,
        String productName,
        String promotionName,
        String description,
        Double discountPercent,
        Double discountAmount,
        Instant validFrom,
        Instant validUntil,
        ChangeRequestStatus status,
        Boolean active,
        String rejectionReason,
        Instant createdAt
) {
    public static PromotionRequestDto from(PromotionRequest p) {
        return new PromotionRequestDto(
                p.getId(),
                p.getRequester().getUsername(),
                p.getRestaurant() != null ? p.getRestaurant().getId() : null,
                p.getRestaurant() != null ? p.getRestaurant().getName() : null,
                p.getTargetProduct() != null ? p.getTargetProduct().getId() : null,
                p.getTargetProduct() != null ? p.getTargetProduct().getName() : null,
                p.getPromotionName(),
                p.getDescription(),
                p.getDiscountPercent(),
                p.getDiscountAmount(),
                p.getValidFrom(),
                p.getValidUntil(),
                p.getStatus(),
                p.getActive(),
                p.getRejectionReason(),
                p.getCreatedAt()
        );
    }
}
