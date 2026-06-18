package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.application.RecommendationContentBasedService;
import com.example.food_delivery.service.domain.ContentBasedRecommendationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecommendationContentBasedImpl implements RecommendationContentBasedService {

    private final ContentBasedRecommendationService contentBasedRecommendationService;
    private final UserRepository userRepository;

    public RecommendationContentBasedImpl(
            ContentBasedRecommendationService contentBasedRecommendationService,
            UserRepository userRepository) {
        this.contentBasedRecommendationService = contentBasedRecommendationService;
        this.userRepository = userRepository;
    }

    @Override
    public List<DisplayProductDto> getAdvancedRecommendations(String username, int limit, boolean applyRules) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return contentBasedRecommendationService
                .getAdvancedRecommendations(user, limit, applyRules)
                .stream()
                .map(DisplayProductDto::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<DisplayProductDto> getColdStartRecommendations(int limit, String category) {
        return contentBasedRecommendationService
                .getColdStartRecommendations(limit, category)
                .stream()
                .map(DisplayProductDto::from)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getUserVectorInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return contentBasedRecommendationService.getUserVectorInfo(user);
    }

    @Override
    public Double calculateProductSimilarity(String username, Long productId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return contentBasedRecommendationService.calculateProductSimilarity(user, productId);
    }

    @Override
    public Map<String, Object> rebuildCache() {
        return contentBasedRecommendationService.rebuildCache();
    }
}