package com.example.food_delivery.dto.domain;


import com.example.food_delivery.model.domain.Product;

import java.util.List;

public record DisplayProductDto(
        Long id,
        String name,
        String description,
        Double price,
        Integer quantity,
        Long restaurantId,
        Boolean isAvailable,
        String category,
        String imageUrl
) {

    public static DisplayProductDto from(Product product) {
        return new DisplayProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getRestaurant().getId(),
                product.getIsAvailable(),
                product.getCategory(),
                product.getImageUrl()
        );
    }

    public static List<DisplayProductDto> from(List<Product> Products) {
        return Products
                .stream()
                .map(DisplayProductDto::from)
                .toList();
    }

}
