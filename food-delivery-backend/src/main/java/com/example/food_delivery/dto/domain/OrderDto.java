package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Courier;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class OrderDto {
    private Long id;
    private String userUsername;
    private String status;

    private Long restaurantId;
    private String restaurantName;
    private AddressDto deliveryAddress;
    private Courier courier;
    private String courierName;

    private List<DisplayProductDto> products;
    private List<OrderItemDto> items;

    private Double subtotal;
    private Double deliveryFee;
    private Double platformFee;
    private Double discount;
    private Double total;

    private Instant placedAt;
    private LocalDateTime deliveredAt;

    private Boolean courierRated;
    private Integer courierRating;
}
