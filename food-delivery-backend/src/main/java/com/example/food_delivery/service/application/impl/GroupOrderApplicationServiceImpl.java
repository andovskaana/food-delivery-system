package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.GroupOrder;
import com.example.food_delivery.model.domain.GroupOrderParticipant;
import com.example.food_delivery.model.enums.GroupSplitType;
import com.example.food_delivery.model.enums.PaymentStatus;
import com.example.food_delivery.service.application.GroupOrderApplicationService;
import com.example.food_delivery.service.domain.GroupOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GroupOrderApplicationServiceImpl implements GroupOrderApplicationService {
    private final GroupOrderService groupOrderService;

    public GroupOrderApplicationServiceImpl(GroupOrderService groupOrderService) {
        this.groupOrderService = groupOrderService;
    }

    @Override
    @Transactional
    public GroupOrderDto createGroupOrder(CreateGroupOrderRequestDto request, String username) {
        if (request == null || request.getSplitCount() == null) {
            throw new IllegalArgumentException("splitCount is required");
        }
        GroupSplitType splitType = parseSplitType(request.getSplitType());
        GroupOrder groupOrder = groupOrderService.createGroupOrder(username, request.getSplitCount(), splitType);
        return withPaymentLinksAndUser(groupOrderService.toDto(groupOrder), groupOrder, username);
    }

    @Override
    public GroupOrderDto getGroupOrder(String code, String username) {
        GroupOrder groupOrder = groupOrderService.getGroupOrder(code);
        return withPaymentLinksAndUser(groupOrderService.toDto(groupOrder), groupOrder, username);
    }

    @Override
    @Transactional
    public GroupOrderParticipantDto joinGroupOrder(String code, JoinGroupOrderRequestDto request, String username) {
        GroupOrderParticipant participant = groupOrderService.joinGroupOrder(
                code,
                request != null ? request.getDisplayName() : null,
                request != null ? request.getEmail() : null,
                username
        );
        return toParticipantDtoWithPaymentLink(participant, username);
    }

    @Override
    public GroupOrderParticipantDto getParticipant(String paymentToken, String username) {
        return toParticipantDtoWithPaymentLink(groupOrderService.getParticipantByToken(paymentToken), username);
    }

    @Override
    @Transactional
    public GroupOrderParticipantDto payParticipant(String paymentToken, String username) {
        return toParticipantDtoWithPaymentLink(groupOrderService.payParticipant(paymentToken), username);
    }

    @Override
    @Transactional
    public GroupOrderParticipantDto failParticipantPayment(String paymentToken, String username) {
        return toParticipantDtoWithPaymentLink(groupOrderService.failParticipantPayment(paymentToken), username);
    }

    @Override
    public GroupOrderDto getStatus(String code, String username) {
        GroupOrder groupOrder = groupOrderService.getGroupOrder(code);
        return withPaymentLinksAndUser(groupOrderService.toDto(groupOrder), groupOrder, username);
    }

    @Override
    @Transactional
    public GroupOrderDto updateSplitCount(String code, UpdateGroupSplitCountRequestDto request, String username) {
        if (request == null || request.getSplitCount() == null) {
            throw new IllegalArgumentException("splitCount is required");
        }
        GroupOrder groupOrder = groupOrderService.updateSplitCount(code, username, request.getSplitCount());
        return withPaymentLinksAndUser(groupOrderService.toDto(groupOrder), groupOrder, username);
    }

    @Override
    @Transactional
    public GroupOrderDto assignItems(String code, AssignGroupItemsRequestDto request, String username) {
        GroupOrder groupOrder = groupOrderService.assignItemsToCurrentUser(
                code,
                username,
                request != null ? request.getOrderItemIds() : List.of()
        );
        return withPaymentLinksAndUser(groupOrderService.toDto(groupOrder), groupOrder, username);
    }

    @Override
    @Transactional
    public void leaveGroupOrder(String code, String username) {
        groupOrderService.leaveGroupOrder(code, username);
    }

    @Override
    public List<GroupOrderDto> getMyGroups(String username) {
        return groupOrderService.findMyGroups(username).stream()
                .map(go -> withPaymentLinksAndUser(groupOrderService.toDto(go), go, username))
                .toList();
    }

    @Override
    public List<GroupOrderDto> getMyActiveGroups(String username) {
        return groupOrderService.findMyActiveGroups(username).stream()
                .map(go -> withPaymentLinksAndUser(groupOrderService.toDto(go), go, username))
                .toList();
    }

    @Override
    @Transactional
    public void cancelGroupOrder(String code, String username) {
        groupOrderService.cancelGroupOrder(code, username);
    }

    private GroupSplitType parseSplitType(String splitType) {
        if (splitType == null || splitType.isBlank()) {
            return GroupSplitType.EQUAL;
        }
        try {
            return GroupSplitType.valueOf(splitType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("splitType must be EQUAL or ITEMS");
        }
    }

    private GroupOrderParticipantDto toParticipantDtoWithPaymentLink(GroupOrderParticipant p, String username) {
        GroupOrderParticipantDto dto = new GroupOrderParticipantDto();
        dto.setId(p.getId());
        dto.setUserUsername(p.getUser() != null ? p.getUser().getUsername() : null);
        dto.setDisplayName(p.getUser() != null ? p.getUser().getUsername() : p.getDisplayName());
        dto.setEmail(p.getEmail());
        dto.setAssignedAmount(p.getAssignedAmount());
        dto.setPaidAmount(p.getPaidAmount());
        dto.setPaymentStatus(p.getPaymentStatus() != null ? p.getPaymentStatus().name() : null);
        dto.setJoinedAt(p.getJoinedAt());
        dto.setPaidAt(p.getPaidAt());
        dto.setPaymentLink("/api/group-orders/participant/" + p.getPaymentToken());
        boolean isCurrentUser = username != null && p.getUser() != null && username.equals(p.getUser().getUsername());
        dto.setCurrentUser(isCurrentUser);
        if (p.getGroupOrder() != null) {
            dto.setGroupCode(p.getGroupOrder().getGroupCode());
            boolean isCreator = p.getGroupOrder().getCreatedBy() != null && p.getUser() != null &&
                    p.getGroupOrder().getCreatedBy().getUsername().equals(p.getUser().getUsername());
            dto.setCreator(isCreator);
            dto.setCanLeave(isCurrentUser && !isCreator && p.getPaymentStatus() != PaymentStatus.CAPTURED);
        }
        return dto;
    }

    private GroupOrderDto withPaymentLinksAndUser(GroupOrderDto dto, GroupOrder groupOrder, String username) {
        if (dto == null) {
            return null;
        }

        dto.setCurrentUserCreator(username != null && groupOrder.getCreatedBy() != null && username.equals(groupOrder.getCreatedBy().getUsername()));

        if (dto.getParticipants() != null && groupOrder.getParticipants() != null) {
            for (GroupOrderParticipantDto p : dto.getParticipants()) {
                groupOrder.getParticipants().stream()
                        .filter(entity -> entity.getId().equals(p.getId()))
                        .findFirst()
                        .ifPresent(entity -> {
                            p.setPaymentLink("/api/group-orders/participant/" + entity.getPaymentToken());
                            p.setGroupCode(groupOrder.getGroupCode());
                            boolean isCurrentUser = username != null && entity.getUser() != null && username.equals(entity.getUser().getUsername());
                            boolean isCreator = groupOrder.getCreatedBy() != null && entity.getUser() != null &&
                                    groupOrder.getCreatedBy().getUsername().equals(entity.getUser().getUsername());
                            p.setCurrentUser(isCurrentUser);
                            p.setCreator(isCreator);
                            p.setCanLeave(isCurrentUser && !isCreator && entity.getPaymentStatus() != PaymentStatus.CAPTURED);
                            if (isCurrentUser) {
                                dto.setCurrentUserParticipantId(entity.getId());
                                dto.setCurrentUserPaymentLink(p.getPaymentLink());
                                dto.setCurrentUserCanLeave(p.getCanLeave());
                            }
                        });
            }
        }

        if (dto.getItems() != null && dto.getCurrentUserParticipantId() != null) {
            dto.getItems().forEach(item -> item.setAssignedToCurrentUser(
                    item.getParticipantId() != null && item.getParticipantId().equals(dto.getCurrentUserParticipantId())
            ));
        }

        return dto;
    }
}
