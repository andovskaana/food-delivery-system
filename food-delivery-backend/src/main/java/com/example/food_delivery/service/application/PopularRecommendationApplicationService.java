package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.DisplayProductDto;

import java.util.List;

public interface PopularRecommendationApplicationService {

    /**
     * Get a list of globally popular product recommendations. These
     * recommendations are based on recent ordering trends across all users
     * and do not depend on the current time of day. The provided username
     * is used to fetch the user entity; future implementations could
     * personalise the recommendations by excluding items previously ordered
     * by the user or prioritising new dishes.
     *
     * @param username the username of the current user requesting recommendations
     * @return list of recommended products represented as display DTOs
     */
    List<DisplayProductDto> getPopularRecommendations(String username);
}