package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.ReviewDto;

import java.util.List;

public interface ReviewApplicationService {
    ReviewDto add(Long restaurantId, String username, int rating, String comment);
    List<ReviewDto> list(Long restaurantId);
}
