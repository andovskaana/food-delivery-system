package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.OrderStatus;

import java.util.List;

public record DisplayOrderDto(
        Long id,
        String username,
        List<DisplayProductDto> Products, // keep same name to avoid breaking FE
        OrderStatus status
) {
    public static DisplayOrderDto from(Order order) {
        return new DisplayOrderDto(
                order.getId(),
                order.getUser().getUsername(),
                DisplayProductDto.from(order.getProducts()),
                order.getStatus()
        );
    }
}
