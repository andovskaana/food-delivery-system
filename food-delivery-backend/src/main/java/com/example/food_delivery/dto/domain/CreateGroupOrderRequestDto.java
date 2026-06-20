package com.example.food_delivery.dto.domain;

import lombok.Data;

@Data
public class CreateGroupOrderRequestDto {
    private Integer splitCount;
    /** EQUAL or ITEMS. Defaults to EQUAL when omitted. */
    private String splitType;
}
