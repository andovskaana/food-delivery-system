package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;

import java.util.List;

/**
 * Service responsible for generating popular menu item recommendations.
 *
 * <p>This service exposes a single method that returns a list of products
 * that are currently trending across the platform. The implementation
 * takes into account recent ordering history across all users, weighting
 * orders by recency and diversity (number of unique users ordering each
 * product). It also filters out any products that are unavailable or
 * out of stock.</p>
 */
public interface PopularMenuRecommendationService {

    /**
     * Get a list of popular product recommendations. The user parameter is
     * provided for future extensibility (e.g. personalizing results based on
     * user preferences or excluding previously ordered items). It is not
     * currently used to narrow down the recommendations.
     *
     * @param user the user requesting recommendations
     * @return a list of popular products
     */
    List<Product> getPopularRecommendations(User user);
}