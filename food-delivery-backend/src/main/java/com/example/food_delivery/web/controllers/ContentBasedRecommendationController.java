package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.RecommendationContentBasedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "advanced-recommendations-controller", description = "Advanced ML-based recommendations with vectorization")
@RestController
@RequestMapping("/api/recommendations/advanced")
@RequiredArgsConstructor
public class ContentBasedRecommendationController {

    private final RecommendationContentBasedService recommendationService;

    /**
     * Get advanced content-based recommendations using:
     * - Feature vectorization (One-Hot Encoding)
     * - TF-IDF for text descriptions
     * - Normalized numeric features
     * - Cosine similarity
     * - Business rules (popularity, recency, etc.)
     */
    @Operation(summary = "Get advanced ML-based recommendations",
            description = "Uses feature vectorization, TF-IDF, and cosine similarity for personalized recommendations")
    @GetMapping
    public ResponseEntity<List<DisplayProductDto>> getAdvancedRecommendations(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "true") boolean applyRules) {

        if (limit < 1 || limit > 50) {
            return ResponseEntity.badRequest().build();
        }

        List<DisplayProductDto> recommendations =
                recommendationService.getAdvancedRecommendations(
                        user.getUsername(), limit, applyRules);

        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get cold-start recommendations for new users.
     * Returns trending/popular products based on recent orders.
     */
    @Operation(summary = "Get cold-start recommendations for new users")
    @GetMapping("/cold-start")
    public ResponseEntity<List<DisplayProductDto>> getColdStartRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String category) {

        if (limit < 1 || limit > 50) {
            return ResponseEntity.badRequest().build();
        }

        List<DisplayProductDto> recommendations =
                recommendationService.getColdStartRecommendations(limit, category);

        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get user profile vector information.
     * Shows statistics about the user's feature vector used for recommendations.
     */
    @Operation(summary = "Get user profile vector information")
    @GetMapping("/user-vector")
    public ResponseEntity<Map<String, Object>> getUserVectorInfo(
            @AuthenticationPrincipal User user) {

        Map<String, Object> vectorInfo =
                recommendationService.getUserVectorInfo(user.getUsername());

        return ResponseEntity.ok(vectorInfo);
    }

    /**
     * Calculate similarity score between a product and the user's profile.
     * Returns a score from 0 to 1, where 1 = perfect match.
     */
    @Operation(summary = "Calculate product-user similarity score")
    @GetMapping("/similarity/{productId}")
    public ResponseEntity<Map<String, Object>> calculateProductSimilarity(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user) {

        Double similarity = recommendationService.calculateProductSimilarity(
                user.getUsername(), productId);

        Map<String, Object> response = Map.of(
                "username", user.getUsername(),
                "product_id", productId,
                "similarity_score", similarity
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Rebuild product vectors cache.
     * Should be called when:
     * - New products are added
     * - Product information is updated
     * - Categories change
     * Admin only endpoint.
     */
    @Operation(summary = "Rebuild product vectors cache (Admin only)")
    @PostMapping("/rebuild-cache")
    public ResponseEntity<Map<String, Object>> rebuildCache() {

        Map<String, Object> result = recommendationService.rebuildCache();

        return ResponseEntity.ok(result);
    }
}