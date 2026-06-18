package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.DisplayProductDto;

import java.util.List;

public interface RecommendationApplicationService {
    /**
     * Get time-of-day based product recommendations for current user
     * @param username The username of the current user
     * @return List of recommended products
     */
    List<DisplayProductDto> getTimeBasedRecommendations(String username);

    /**
     * Get product recommendations for a specific hour
     * @param username The username of the current user
     * @param hourOfDay The hour (0-23) to get recommendations for
     * @return List of recommended products
     */
    List<DisplayProductDto> getRecommendationsForHour(String username, int hourOfDay);
}