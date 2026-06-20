package com.example.food_delivery.dto.domain;

import lombok.Data;

@Data
public class GroupOrderItemAssignmentDto {
    private Long orderItemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double unitPriceSnapshot;
    private Double lineTotal;
    private Boolean assigned;
    private Long participantId;
    private String participantDisplayName;
    private Boolean assignedToCurrentUser;
}
