package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.Review;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.repository.ReviewRepository;
import com.example.food_delivery.service.domain.ReviewService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Override
    public Review add(Restaurant restaurant, User user, int rating, String comment) {
        Review r = new Review();
        r.setRestaurant(restaurant);
        r.setUser(user);
        r.setRating(rating);
        r.setComment(comment);
        return reviewRepository.save(r);
    }

    @Override
    public List<Review> forRestaurant(Restaurant restaurant) {
        return reviewRepository.findByRestaurant(restaurant);
    }
}
