package com.example.food_delivery.service.application;

import com.example.food_delivery.model.domain.Product;

import java.util.List;

public interface CrossSellRecommendationService {
    List<Product> getCrossSellRecommendations(List<Integer> productIds, int limit);
}
