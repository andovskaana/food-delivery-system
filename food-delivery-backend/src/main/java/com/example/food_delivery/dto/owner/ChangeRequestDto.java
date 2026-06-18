package com.example.food_delivery.dto.owner;

import com.example.food_delivery.model.domain.OwnerChangeRequest;
import com.example.food_delivery.model.enums.ChangeRequestStatus;
import com.example.food_delivery.model.enums.ChangeRequestType;

import java.time.Instant;

public record ChangeRequestDto(
        Long id,
        String requesterUsername,
        Long restaurantId,
        String restaurantName,
        Long targetProductId,
        ChangeRequestType type,
        ChangeRequestStatus status,
        String payload,
        String rejectionReason,
        Instant createdAt,
        Instant reviewedAt,
        String reviewedByUsername
) {
    public static ChangeRequestDto from(OwnerChangeRequest r) {
        return new ChangeRequestDto(
                r.getId(),
                r.getRequester().getUsername(),
                r.getRestaurant() != null ? r.getRestaurant().getId() : null,
                r.getRestaurant() != null ? r.getRestaurant().getName() : null,
                r.getTargetProductId(),
                r.getType(),
                r.getStatus(),
                r.getPayload(),
                r.getRejectionReason(),
                r.getCreatedAt(),
                r.getReviewedAt(),
                r.getReviewedBy() != null ? r.getReviewedBy().getUsername() : null
        );
    }
}
