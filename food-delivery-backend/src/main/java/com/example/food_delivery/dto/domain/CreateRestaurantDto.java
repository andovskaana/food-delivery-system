package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Restaurant;

public record CreateRestaurantDto(
        String name,
        String description,
        String openHours,
        String imageUrl,
        String category,
        Double averageRating,
        Boolean isOpen,
        Integer deliveryTimeEstimate
) {

    public Restaurant toRestaurant() {
        return new Restaurant(name, description,imageUrl,openHours,category,isOpen,deliveryTimeEstimate,averageRating);
    }

}
