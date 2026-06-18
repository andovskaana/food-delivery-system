package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.service.domain.SentimentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SentimentServiceImpl implements SentimentService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${sentiment.api.base-url:http://localhost:5002}")
    private String sentimentApiBaseUrl;

    public SentimentServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Double getSentimentScore(Long restaurantId) {
        try {
            String url = String.format("%s/api/sentiment/%d", sentimentApiBaseUrl, restaurantId);
            String response = restTemplate.getForObject(url, String.class);

            Map<String, Object> map = objectMapper.readValue(response, new TypeReference<>() {});
            Object score = map.get("sentiment_score");

            if (score instanceof Number) {
                return ((Number) score).doubleValue();
            }
            return null;

        } catch (Exception e) {
            System.err.println("Error calling sentiment API: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public Map<Long, Double> getAllSentimentScores() {
        try {
            String url = String.format("%s/api/sentiment", sentimentApiBaseUrl);
            String response = restTemplate.getForObject(url, String.class);

            List<Map<String, Object>> list = objectMapper.readValue(response, new TypeReference<>() {});
            if (list == null || list.isEmpty()) return Collections.emptyMap();

            return list.stream()
                    .filter(m -> m.get("restaurant_id") != null && m.get("sentiment_score") != null)
                    .collect(Collectors.toMap(
                            m -> ((Number) m.get("restaurant_id")).longValue(),
                            m -> ((Number) m.get("sentiment_score")).doubleValue()
                    ));

        } catch (Exception e) {
            System.err.println("Error calling sentiment API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyMap();
        }
    }
}
