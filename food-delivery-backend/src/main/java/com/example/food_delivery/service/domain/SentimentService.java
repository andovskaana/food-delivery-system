package com.example.food_delivery.service.domain;

import java.util.Map;

public interface SentimentService {
    Double getSentimentScore(Long restaurantId);
    Map<Long, Double> getAllSentimentScores();
}
