package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Restaurant;

import java.util.List;
import java.util.Optional;

public interface RestaurantService {
    List<Restaurant> findAll();

    Optional<Restaurant> findById(Long id);

    Restaurant save(Restaurant restaurant);

    Optional<Restaurant> update(Long id, Restaurant restaurant);

    Optional<Restaurant> deleteById(Long id);
}
