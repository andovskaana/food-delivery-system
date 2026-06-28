package com.example.food_delivery.dto.owner;

import java.time.Instant;

public record CreatePromotionRequestDto(
        String promotionName,
        String description,
        Double discountPercent,
        Double discountAmount,
        Instant validFrom,
        Instant validUntil,
        Long targetProductId,
        Long productId
) {
    public Long resolvedTargetProductId() {
        return targetProductId != null ? targetProductId : productId;
    }
}
