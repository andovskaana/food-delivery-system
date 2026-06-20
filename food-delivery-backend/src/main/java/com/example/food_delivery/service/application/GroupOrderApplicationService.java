package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.*;

import java.util.List;

public interface GroupOrderApplicationService {
    GroupOrderDto createGroupOrder(CreateGroupOrderRequestDto request, String username);
    GroupOrderDto getGroupOrder(String code, String username);
    GroupOrderParticipantDto joinGroupOrder(String code, JoinGroupOrderRequestDto request, String username);
    GroupOrderParticipantDto getParticipant(String paymentToken, String username);
    GroupOrderParticipantDto payParticipant(String paymentToken, String username);
    GroupOrderParticipantDto failParticipantPayment(String paymentToken, String username);
    GroupOrderDto getStatus(String code, String username);
    GroupOrderDto updateSplitCount(String code, UpdateGroupSplitCountRequestDto request, String username);
    GroupOrderDto assignItems(String code, AssignGroupItemsRequestDto request, String username);
    void leaveGroupOrder(String code, String username);
    List<GroupOrderDto> getMyGroups(String username);
    List<GroupOrderDto> getMyActiveGroups(String username);
    void cancelGroupOrder(String code, String username);
}
