package com.example.food_delivery.dto.domain;

import lombok.Data;

import java.util.List;

@Data
public class AssignGroupItemsRequestDto {
    private List<Long> orderItemIds;
}
