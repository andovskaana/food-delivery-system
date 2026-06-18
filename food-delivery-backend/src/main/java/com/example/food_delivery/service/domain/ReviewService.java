package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.Review;
import com.example.food_delivery.model.domain.User;

import java.util.List;

public interface ReviewService {
    Review add(Restaurant restaurant, User user, int rating, String comment);
    List<Review> forRestaurant(Restaurant restaurant);
}
