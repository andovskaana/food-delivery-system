package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.ReviewDto;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.Review;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.repository.RestaurantRepository;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.application.ReviewApplicationService;
import com.example.food_delivery.service.domain.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewApplicationServiceImpl implements ReviewApplicationService {

    private final ReviewService domain;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public ReviewApplicationServiceImpl(ReviewService domain, RestaurantRepository restaurantRepository, UserRepository userRepository) {
        this.domain = domain;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ReviewDto add(Long restaurantId, String username, int rating, String comment) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        User u = userRepository.findByUsername(username).orElseThrow();
        Review saved = domain.add(r, u, rating, comment);
        return BasicMappers.toDto(saved);
    }

    @Override
    public List<ReviewDto> list(Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        return domain.forRestaurant(r).stream().map(BasicMappers::toDto).collect(Collectors.toList());
    }
}
