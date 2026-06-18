package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @Override
    @Query("SELECT r FROM Restaurant r ORDER BY r.id ASC")
    List<Restaurant> findAll();
}
