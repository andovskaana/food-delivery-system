// Food-Delivery-App/food-delivery-backend/src/main/java/com/example/fooddelivery/service/impl/CrossSellRecommendationServiceImpl.java
package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.service.application.CrossSellRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of the cross‑sell recommendation service that delegates to
 * the Python ML microservice.  It constructs a REST call to the ML endpoint,
 * parses the response containing product IDs and then loads the corresponding
 * `Product` entities from the database via the JPA repository.
 */
@Service
public class CrossSellRecommendationServiceImpl implements CrossSellRecommendationService {

    private static final String ML_SERVICE_BASE_URL =
            "http://localhost:5002/api/recommendations/cross-sell";

    private final RestTemplate restTemplate;
    private final ProductRepository productRepository;

    @Autowired
    public CrossSellRecommendationServiceImpl(
            RestTemplate restTemplate,
            ProductRepository productRepository
    ) {
        this.restTemplate = restTemplate;
        this.productRepository = productRepository;
    }

    @Override
    public List<Product> getCrossSellRecommendations(List<Integer> productIds, int limit) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }
        String productIdsParam = productIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        String url = UriComponentsBuilder.fromHttpUrl(ML_SERVICE_BASE_URL)
                .queryParam("productIds", productIdsParam)
                .queryParam("limit", limit)
                .toUriString();
        ResponseEntity<CrossSellResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        List<Integer> recommendedIds =
                (response.getBody() != null) ? response.getBody().getRecommendedProductIds() : List.of();
        if (recommendedIds == null || recommendedIds.isEmpty()) {
            return List.of();
        }

        List<Long> idsAsLong = recommendedIds.stream()
                .map(Integer::longValue)
                .toList();

        return productRepository.findAllById(idsAsLong)
                .stream()
                .toList();

    }

    /** Helper DTO for deserialising ML service responses. */
    private static class CrossSellResponse {
        private List<Integer> recommendedProductIds;
        public List<Integer> getRecommendedProductIds() { return recommendedProductIds; }
        public void setRecommendedProductIds(List<Integer> recommendedProductIds) {
            this.recommendedProductIds = recommendedProductIds;
        }
    }
}
