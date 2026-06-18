package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Product;

public record DisplayProductDetailsDto(
        Long id,
        String name,
        String description,
        Double price,
        Integer quantity,
        DisplayRestaurantDto restaurant
) {

    public static DisplayProductDetailsDto from(Product Product) {
        return new DisplayProductDetailsDto(
                Product.getId(),
                Product.getName(),
                Product.getDescription(),
                Product.getPrice(),
                Product.getQuantity(),
                DisplayRestaurantDto.from(Product.getRestaurant())
        );
    }

}
