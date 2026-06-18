package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;

import java.util.List;

public interface TimeOfDayRecommendationService {
    /**
     * Get product recommendations based on current time of day and user's ordering history
     * @param user The user to get recommendations for
     * @return List of recommended products
     */
    List<Product> getTimeBasedRecommendations(User user);

    /**
     * Get product recommendations for a specific hour
     * @param user The user to get recommendations for
     * @param hourOfDay The hour (0-23) to get recommendations for
     * @return List of recommended products
     */
    List<Product> getRecommendationsForHour(User user, int hourOfDay);
}