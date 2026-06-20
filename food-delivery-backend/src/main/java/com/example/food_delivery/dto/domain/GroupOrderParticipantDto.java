package com.example.food_delivery.dto.domain;

import lombok.Data;

import java.time.Instant;

@Data
public class GroupOrderParticipantDto {
    private Long id;
    private String userUsername;
    private String displayName;
    private String email;
    private Double assignedAmount;
    private Double paidAmount;
    private String paymentStatus;
    private String paymentLink;
    private Instant joinedAt;
    private Instant paidAt;
    private String groupCode;
    private Boolean creator;
    private Boolean currentUser;
    private Boolean canLeave;
}
