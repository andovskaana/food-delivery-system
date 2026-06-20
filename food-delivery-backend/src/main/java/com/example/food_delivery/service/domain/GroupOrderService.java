package com.example.food_delivery.service.domain;

import com.example.food_delivery.dto.domain.GroupOrderDto;
import com.example.food_delivery.model.domain.GroupOrder;
import com.example.food_delivery.model.domain.GroupOrderParticipant;
import com.example.food_delivery.model.enums.GroupSplitType;

import java.util.List;

public interface GroupOrderService {
    GroupOrder createGroupOrder(String username, int splitCount, GroupSplitType splitType);
    GroupOrder getGroupOrder(String groupCode);
    GroupOrderParticipant joinGroupOrder(String groupCode, String displayName, String email, String username);
    GroupOrderParticipant getParticipantByToken(String paymentToken);
    GroupOrderParticipant payParticipant(String paymentToken);
    GroupOrderParticipant failParticipantPayment(String paymentToken);
    GroupOrder updateSplitCount(String groupCode, String username, int splitCount);
    void leaveGroupOrder(String groupCode, String username);
    GroupOrder assignItemsToCurrentUser(String groupCode, String username, List<Long> orderItemIds);
    List<GroupOrder> findMyGroups(String username);
    List<GroupOrder> findMyActiveGroups(String username);
    GroupOrderDto toDto(GroupOrder groupOrder);
    void cancelGroupOrder(String groupCode, String username);
}
