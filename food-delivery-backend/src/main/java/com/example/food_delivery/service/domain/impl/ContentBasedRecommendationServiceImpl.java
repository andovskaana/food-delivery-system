package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.service.domain.ContentBasedRecommendationService;
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
public class ContentBasedRecommendationServiceImpl implements ContentBasedRecommendationService {

    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${recommendation.api.advanced-url:http://localhost:5002}")
    private String advancedApiBaseUrl;

    public ContentBasedRecommendationServiceImpl(
            ProductRepository productRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<Product> getAdvancedRecommendations(User user, int limit, boolean applyRules) {
        try {
            // Call Python API
            String url = String.format("%s/api/recommendations/advanced/%s?n=%d&apply_rules=%s",
                    advancedApiBaseUrl, user.getUsername(), limit, applyRules);

            String response = restTemplate.getForObject(url, String.class);

            // Parse response
            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> recommendations =
                    (List<Map<String, Object>>) responseMap.get("recommendations");

            if (recommendations == null || recommendations.isEmpty()) {
                return Collections.emptyList();
            }

            // Extract product IDs
            List<Long> productIds = recommendations.stream()
                    .map(rec -> ((Number) rec.get("product_id")).longValue())
                    .collect(Collectors.toList());

            // Fetch products from database and maintain order
            List<Product> products = productRepository.findAllById(productIds);

            Map<Long, Product> productMap = products.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));

            return productIds.stream()
                    .map(productMap::get)
                    .filter(p -> p != null)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error calling advanced recommendation API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    @Override
    public List<Product> getColdStartRecommendations(int limit, String category) {
        try {
            // Build URL with optional category parameter
            String url = String.format("%s/api/recommendations/cold-start?n=%d",
                    advancedApiBaseUrl, limit);

            if (category != null && !category.isEmpty()) {
                url += "&category=" + category;
            }

            String response = restTemplate.getForObject(url, String.class);

            // Parse response
            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> recommendations =
                    (List<Map<String, Object>>) responseMap.get("recommendations");

            if (recommendations == null || recommendations.isEmpty()) {
                return Collections.emptyList();
            }

            // Extract product IDs
            List<Long> productIds = recommendations.stream()
                    .map(rec -> ((Number) rec.get("product_id")).longValue())
                    .collect(Collectors.toList());

            // Fetch products from database
            List<Product> products = productRepository.findAllById(productIds);

            Map<Long, Product> productMap = products.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));

            return productIds.stream()
                    .map(productMap::get)
                    .filter(p -> p != null)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error calling cold-start API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    @Override
    public Map<String, Object> getUserVectorInfo(User user) {
        try {
            // Call Python API
            String url = String.format("%s/api/recommendations/user-vector/%s",
                    advancedApiBaseUrl, user.getUsername());

            String response = restTemplate.getForObject(url, String.class);

            // Parse and return response
            return objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

        } catch (Exception e) {
            System.err.println("Error calling user vector API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyMap();
        }
    }

    @Override
    public Double calculateProductSimilarity(User user, Long productId) {
        try {
            // Call Python API
            String url = String.format("%s/api/recommendations/similarity/%d?username=%s",
                    advancedApiBaseUrl, productId, user.getUsername());

            String response = restTemplate.getForObject(url, String.class);

            // Parse response
            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            Object score = responseMap.get("similarity_score");

            if (score instanceof Number) {
                return ((Number) score).doubleValue();
            }

            return 0.0;

        } catch (Exception e) {
            System.err.println("Error calling similarity API: " + e.getMessage());
            e.printStackTrace();
            return 0.0;
        }
    }

    @Override
    public Map<String, Object> rebuildCache() {
        try {
            // Call Python API (POST request)
            String url = String.format("%s/api/recommendations/rebuild-cache",
                    advancedApiBaseUrl);

            String response = restTemplate.postForObject(url, null, String.class);

            // Parse and return response
            return objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

        } catch (Exception e) {
            System.err.println("Error calling rebuild cache API: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
            );
        }
    }
}