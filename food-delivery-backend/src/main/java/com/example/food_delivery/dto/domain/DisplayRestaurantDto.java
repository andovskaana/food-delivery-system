package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Address;
import com.example.food_delivery.model.domain.Restaurant;

import java.util.List;

public record DisplayRestaurantDto(
        Long id,
        String name,
        String description,
        Address address,
        String openHours,
        Double averageRating,
        Integer deliveryTimeEstimate,
        Boolean isOpen,
        String imageUrl,
        String category
) {

    public static DisplayRestaurantDto from(Restaurant restaurant) {
        return new DisplayRestaurantDto(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.getOpenHours(),
                restaurant.getAverageRating(),
                restaurant.getDeliveryTimeEstimate(),
                restaurant.getIsOpen(),
                restaurant.getImageUrl(),
                restaurant.getCategory()
        );
    }

    public static List<DisplayRestaurantDto> from(List<Restaurant> restaurants) {
        return restaurants
                .stream()
                .map(DisplayRestaurantDto::from)
                .toList();
    }

}
