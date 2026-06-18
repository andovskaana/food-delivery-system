package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.RestaurantOwner;
import com.example.food_delivery.model.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantOwnerRepository extends JpaRepository<RestaurantOwner, Long> {

    Optional<RestaurantOwner> findByUser(User user);

    Optional<RestaurantOwner> findByUser_Username(String username);

    @Query("SELECT ro FROM RestaurantOwner ro JOIN ro.restaurants r WHERE r = :restaurant")
    Optional<RestaurantOwner> findByRestaurant(@Param("restaurant") Restaurant restaurant);
}
