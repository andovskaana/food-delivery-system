package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.repository.RestaurantRepository;
import com.example.food_delivery.service.domain.RestaurantService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public List<Restaurant> findAll() {
        return restaurantRepository.findAll();
    }

    @Override
    public Optional<Restaurant> findById(Long id) {
        return restaurantRepository.findById(id);
    }

    @Override
    public Restaurant save(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    @Override
    public Optional<Restaurant> update(Long id, Restaurant restaurant) {
        return restaurantRepository.findById(id)
                .map(existingRestaurant -> {
                    existingRestaurant.setName(restaurant.getName());
                    existingRestaurant.setDescription(restaurant.getDescription());
                    existingRestaurant.setAddress(restaurant.getAddress());
                    existingRestaurant.setCategory(restaurant.getCategory());
                    existingRestaurant.setDeliveryTimeEstimate(restaurant.getDeliveryTimeEstimate());
                    existingRestaurant.setImageUrl(restaurant.getImageUrl());
                    existingRestaurant.setAverageRating(restaurant.getAverageRating());
                    existingRestaurant.setIsOpen(restaurant.getIsOpen());
                    existingRestaurant.setOpenHours(restaurant.getOpenHours());
                    return restaurantRepository.save(existingRestaurant);
                });
    }

    @Override
    public Optional<Restaurant> deleteById(Long id) {
        Optional<Restaurant> restaurant = findById(id);
        restaurant.ifPresent(restaurantRepository::delete);
        return restaurant;
    }

}
