package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Product;

public record DisplayProductDetailsDto(
        Long id,
        String name,
        String description,
        Double price,
        Integer quantity,
        String category,
        String imageUrl,
        Boolean isAvailable,
        DisplayRestaurantDto restaurant,
        Double discountPercent,
        Double discountedPrice,
        String promotionName
) {

    public static DisplayProductDetailsDto from(Product product) {
        return from(product, null, null, null);
    }

    public static DisplayProductDetailsDto from(Product product,
                                                Double discountPercent,
                                                Double discountedPrice,
                                                String promotionName) {
        return new DisplayProductDetailsDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getCategory(),
                product.getImageUrl(),
                product.getIsAvailable(),
                DisplayRestaurantDto.from(product.getRestaurant()),
                discountPercent,
                discountedPrice,
                promotionName
        );
    }
}
