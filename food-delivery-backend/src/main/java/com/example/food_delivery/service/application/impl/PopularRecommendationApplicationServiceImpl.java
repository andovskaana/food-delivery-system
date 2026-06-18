package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.application.PopularRecommendationApplicationService;
import com.example.food_delivery.service.domain.PopularMenuRecommendationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PopularRecommendationApplicationServiceImpl implements PopularRecommendationApplicationService {

    private final PopularMenuRecommendationService popularMenuRecommendationService;
    private final UserRepository userRepository;

    public PopularRecommendationApplicationServiceImpl(
            PopularMenuRecommendationService popularMenuRecommendationService,
            UserRepository userRepository
    ) {
        this.popularMenuRecommendationService = popularMenuRecommendationService;
        this.userRepository = userRepository;
    }

    @Override
    public List<DisplayProductDto> getPopularRecommendations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return popularMenuRecommendationService.getPopularRecommendations(user)
                .stream()
                .map(DisplayProductDto::from)
                .collect(Collectors.toList());
    }
}
