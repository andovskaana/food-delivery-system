package com.example.food_delivery.dto.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryZoneDto {
    private Long id;
    private String name;
    private Double radiusKm;
    private CoordinatesDto center;
    private Double deliveryFee;
}