package com.example.food_delivery.dto.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderItemDto {
    private Long id;
    private Long ProductId;
    private String ProductName;
    private Integer quantity;
    private Double unitPriceSnapshot;
    private Double lineTotal;
    private String imageUrl;
}
