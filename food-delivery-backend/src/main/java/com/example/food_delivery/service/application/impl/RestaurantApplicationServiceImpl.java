package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.CreateRestaurantDto;
import com.example.food_delivery.dto.domain.DisplayRestaurantDto;
import com.example.food_delivery.service.application.RestaurantApplicationService;
import com.example.food_delivery.service.domain.RestaurantService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RestaurantApplicationServiceImpl implements RestaurantApplicationService {

    private final RestaurantService restaurantService;

    public RestaurantApplicationServiceImpl(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Override
    public List<DisplayRestaurantDto> findAll() {
        return DisplayRestaurantDto.from(restaurantService.findAll());
    }

    @Override
    public Optional<DisplayRestaurantDto> findById(Long id) {
        return restaurantService
                .findById(id)
                .map(DisplayRestaurantDto::from);
    }

    @Override
    public DisplayRestaurantDto save(CreateRestaurantDto createRestaurantDto) {
        return DisplayRestaurantDto.from(restaurantService.save(createRestaurantDto.toRestaurant()));
    }

    @Override
    public Optional<DisplayRestaurantDto> update(Long id, CreateRestaurantDto createRestaurantDto) {
        return restaurantService
                .update(id, createRestaurantDto.toRestaurant())
                .map(DisplayRestaurantDto::from);
    }

    @Override
    public Optional<DisplayRestaurantDto> deleteById(Long id) {
        return restaurantService
                .deleteById(id)
                .map(DisplayRestaurantDto::from);
    }

}
