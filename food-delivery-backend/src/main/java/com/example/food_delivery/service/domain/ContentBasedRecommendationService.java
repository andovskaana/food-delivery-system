package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;

import java.util.List;
import java.util.Map;

public interface ContentBasedRecommendationService {
    /**
     * Get advanced content-based recommendations using:
     * - Feature vectorization (One-Hot + TF-IDF + Normalized)
     * - Cosine similarity
     * - Business rules
     *
     * @param user The user to get recommendations for
     * @param limit Number of recommendations to return
     * @param applyRules Whether to apply business rules
     * @return List of recommended products
     */
    List<Product> getAdvancedRecommendations(User user, int limit, boolean applyRules);

    /**
     * Get cold-start recommendations for new users
     * Returns trending/popular products
     *
     * @param limit Number of recommendations to return
     * @param category Optional category filter
     * @return List of popular products
     */
    List<Product> getColdStartRecommendations(int limit, String category);

    /**
     * Get user profile vector information
     * Shows statistics about the user's feature vector
     *
     * @param user The user to get vector info for
     * @return Map containing vector metadata and statistics
     */
    Map<String, Object> getUserVectorInfo(User user);

    /**
     * Calculate similarity score between a product and user's profile
     *
     * @param user The user
     * @param productId The product ID
     * @return Similarity score (0 to 1)
     */
    Double calculateProductSimilarity(User user, Long productId);

    /**
     * Rebuild product vectors cache
     * Should be called when products are updated
     *
     * @return Status message
     */
    Map<String, Object> rebuildCache();
}