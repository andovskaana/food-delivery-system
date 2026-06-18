package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.application.RecommendationApplicationService;
import com.example.food_delivery.service.domain.TimeOfDayRecommendationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecommendationApplicationServiceImpl implements RecommendationApplicationService {

    private final TimeOfDayRecommendationService timeOfDayRecommendationService;
    private final UserRepository userRepository;

    public RecommendationApplicationServiceImpl(
            TimeOfDayRecommendationService timeOfDayRecommendationService,
            UserRepository userRepository) {
        this.timeOfDayRecommendationService = timeOfDayRecommendationService;
        this.userRepository = userRepository;
    }

    @Override
    public List<DisplayProductDto> getTimeBasedRecommendations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return timeOfDayRecommendationService.getTimeBasedRecommendations(user)
                .stream()
                .map(DisplayProductDto::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<DisplayProductDto> getRecommendationsForHour(String username, int hourOfDay) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return timeOfDayRecommendationService.getRecommendationsForHour(user, hourOfDay)
                .stream()
                .map(DisplayProductDto::from)
                .collect(Collectors.toList());
    }
}