package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.DisplayProductDto;

import java.util.List;
import java.util.Map;

public interface RecommendationContentBasedService {
    /**
     * Get advanced content-based recommendations for current user
     * Uses feature vectorization, TF-IDF, and cosine similarity
     *
     * @param username The username of the current user
     * @param limit Number of recommendations to return
     * @param applyRules Whether to apply business rules
     * @return List of recommended products
     */
    List<DisplayProductDto> getAdvancedRecommendations(String username, int limit, boolean applyRules);

    /**
     * Get cold-start recommendations (for new users)
     *
     * @param limit Number of recommendations to return
     * @param category Optional category filter
     * @return List of popular products
     */
    List<DisplayProductDto> getColdStartRecommendations(int limit, String category);

    /**
     * Get user profile vector information
     *
     * @param username The username to get vector info for
     * @return Map containing vector metadata and statistics
     */
    Map<String, Object> getUserVectorInfo(String username);

    /**
     * Calculate similarity between a product and user's profile
     *
     * @param username The username
     * @param productId The product ID
     * @return Similarity score (0 to 1)
     */
    Double calculateProductSimilarity(String username, Long productId);

    /**
     * Rebuild product vectors cache
     *
     * @return Status message
     */
    Map<String, Object> rebuildCache();
}