package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRestaurant(Restaurant restaurant);
}
