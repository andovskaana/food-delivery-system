package com.example.food_delivery.dto.domain;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class GroupOrderDto {
    private Long orderId;
    private String groupCode;
    private String createdByUsername;
    private Integer splitCount;
    private String splitType;
    private Double totalAmount;
    private Double paidAmount;
    private Double remainingAmount;
    private String status;
    private Integer joinedParticipantsCount;
    private Integer paidParticipantsCount;
    private Integer pendingParticipantsCount;
    private Boolean allItemsAssigned;
    private Boolean currentUserCreator;
    private Long currentUserParticipantId;
    private String currentUserPaymentLink;
    private Boolean currentUserCanLeave;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant finalizedAt;
    private List<GroupOrderParticipantDto> participants;
    private List<GroupOrderItemAssignmentDto> items;
}
