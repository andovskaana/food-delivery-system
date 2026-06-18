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
    private String userUsername;          // lightweight user ref
    private String status;                // OrderStatus as string

    private Long restaurantId;
    private String restaurantName;
    private AddressDto deliveryAddress;
    private Courier courier;

    private List<DisplayProductDto> products;

    private List<OrderItemDto> items;

    private Double subtotal;
    private Double deliveryFee;
    private Double platformFee;
    private Double discount;
    private Double total;

    private Instant placedAt;
    private LocalDateTime deliveredAt;
}
