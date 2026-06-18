package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.CreateRestaurantDto;
import com.example.food_delivery.dto.domain.DisplayRestaurantDto;

import java.util.List;
import java.util.Optional;

public interface RestaurantApplicationService {
    List<DisplayRestaurantDto> findAll();

    Optional<DisplayRestaurantDto> findById(Long id);

    DisplayRestaurantDto save(CreateRestaurantDto createRestaurantDto);

    Optional<DisplayRestaurantDto> update(Long id, CreateRestaurantDto createRestaurantDto);

    Optional<DisplayRestaurantDto> deleteById(Long id);
}
