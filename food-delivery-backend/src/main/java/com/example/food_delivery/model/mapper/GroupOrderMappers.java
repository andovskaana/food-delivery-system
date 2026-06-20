package com.example.food_delivery.model.mapper;

import com.example.food_delivery.dto.domain.GroupOrderDto;
import com.example.food_delivery.dto.domain.GroupOrderItemAssignmentDto;
import com.example.food_delivery.dto.domain.GroupOrderParticipantDto;
import com.example.food_delivery.model.domain.GroupOrder;
import com.example.food_delivery.model.domain.GroupOrderItemAssignment;
import com.example.food_delivery.model.domain.GroupOrderParticipant;
import com.example.food_delivery.model.domain.OrderItem;
import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.enums.GroupSplitType;
import com.example.food_delivery.model.enums.PaymentStatus;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class GroupOrderMappers {
    private GroupOrderMappers() {}

    public static GroupOrderDto toDto(GroupOrder groupOrder) {
        if (groupOrder == null) return null;

        GroupOrderDto dto = new GroupOrderDto();
        dto.setOrderId(groupOrder.getOrder() != null ? groupOrder.getOrder().getId() : null);
        dto.setGroupCode(groupOrder.getGroupCode());
        dto.setCreatedByUsername(groupOrder.getCreatedBy() != null ? groupOrder.getCreatedBy().getUsername() : null);
        dto.setSplitCount(groupOrder.getSplitCount());
        dto.setSplitType(groupOrder.getSplitType() != null ? groupOrder.getSplitType().name() : GroupSplitType.EQUAL.name());
        dto.setTotalAmount(groupOrder.getTotalAmount());
        dto.setPaidAmount(groupOrder.getPaidAmount());
        dto.setRemainingAmount(round2((groupOrder.getTotalAmount() == null ? 0.0 : groupOrder.getTotalAmount()) -
                (groupOrder.getPaidAmount() == null ? 0.0 : groupOrder.getPaidAmount())));
        dto.setStatus(groupOrder.getStatus() != null ? groupOrder.getStatus().name() : null);
        dto.setCreatedAt(groupOrder.getCreatedAt());
        dto.setExpiresAt(groupOrder.getExpiresAt());
        dto.setFinalizedAt(groupOrder.getFinalizedAt());

        List<GroupOrderParticipantDto> participantDtos = new ArrayList<>();
        int paidCount = 0;
        if (groupOrder.getParticipants() != null) {
            for (GroupOrderParticipant p : groupOrder.getParticipants()) {
                participantDtos.add(toDto(p));
                if (p.getPaymentStatus() == PaymentStatus.CAPTURED) {
                    paidCount++;
                }
            }
        }
        participantDtos.sort(Comparator.comparing(GroupOrderParticipantDto::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        int joinedCount = participantDtos.size();
        int splitCount = groupOrder.getSplitCount() == null ? 0 : groupOrder.getSplitCount();

        dto.setParticipants(participantDtos);
        dto.setJoinedParticipantsCount(joinedCount);
        dto.setPaidParticipantsCount(paidCount);
        dto.setPendingParticipantsCount(Math.max(0, splitCount - paidCount));
        dto.setItems(toItemDtos(groupOrder));
        dto.setAllItemsAssigned(dto.getItems() != null && !dto.getItems().isEmpty() && dto.getItems().stream().allMatch(i -> Boolean.TRUE.equals(i.getAssigned())));

        return dto;
    }

    public static GroupOrderParticipantDto toDto(GroupOrderParticipant participant) {
        if (participant == null) return null;

        GroupOrderParticipantDto dto = new GroupOrderParticipantDto();
        dto.setId(participant.getId());
        dto.setUserUsername(participant.getUser() != null ? participant.getUser().getUsername() : null);
        dto.setDisplayName(participant.getUser() != null ? participant.getUser().getUsername() : participant.getDisplayName());
        dto.setEmail(participant.getEmail());
        dto.setAssignedAmount(participant.getAssignedAmount());
        dto.setPaidAmount(participant.getPaidAmount());
        PaymentStatus status = participant.getPaymentStatus();
        dto.setPaymentStatus(status != null ? status.name() : null);
        dto.setJoinedAt(participant.getJoinedAt());
        dto.setPaidAt(participant.getPaidAt());

        if (participant.getGroupOrder() != null) {
            dto.setGroupCode(participant.getGroupOrder().getGroupCode());
            dto.setCreator(participant.getGroupOrder().getCreatedBy() != null && participant.getUser() != null &&
                    participant.getGroupOrder().getCreatedBy().getUsername().equals(participant.getUser().getUsername()));
        }

        return dto;
    }

    private static List<GroupOrderItemAssignmentDto> toItemDtos(GroupOrder groupOrder) {
        List<GroupOrderItemAssignmentDto> result = new ArrayList<>();
        if (groupOrder == null || groupOrder.getOrder() == null || groupOrder.getOrder().getItems() == null) {
            return result;
        }

        Map<Long, GroupOrderItemAssignment> assignmentsByOrderItemId = new HashMap<>();
        if (groupOrder.getItemAssignments() != null) {
            for (GroupOrderItemAssignment assignment : groupOrder.getItemAssignments()) {
                if (assignment.getOrderItem() != null && assignment.getOrderItem().getId() != null) {
                    assignmentsByOrderItemId.put(assignment.getOrderItem().getId(), assignment);
                }
            }
        }

        for (OrderItem item : groupOrder.getOrder().getItems()) {
            Product product = item.getProduct();
            GroupOrderItemAssignment assignment = assignmentsByOrderItemId.get(item.getId());

            GroupOrderItemAssignmentDto dto = new GroupOrderItemAssignmentDto();
            dto.setOrderItemId(item.getId());
            dto.setProductId(product != null ? product.getId() : null);
            dto.setProductName(product != null ? product.getName() : "Item");
            dto.setQuantity(item.getQuantity());
            dto.setUnitPriceSnapshot(item.getUnitPriceSnapshot());
            dto.setLineTotal(round2(item.getLineTotal()));
            dto.setAssigned(assignment != null);
            if (assignment != null && assignment.getParticipant() != null) {
                dto.setParticipantId(assignment.getParticipant().getId());
                dto.setParticipantDisplayName(assignment.getParticipant().getUser() != null
                        ? assignment.getParticipant().getUser().getUsername()
                        : assignment.getParticipant().getDisplayName());
            }
            result.add(dto);
        }

        result.sort(Comparator.comparing(GroupOrderItemAssignmentDto::getOrderItemId, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
