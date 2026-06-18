package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.UserOrderHistory;
import com.example.food_delivery.model.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserOrderHistoryRepository extends JpaRepository<UserOrderHistory, Long> {

    List<UserOrderHistory> findByUser(User user);

    List<UserOrderHistory> findByUserOrderByOrderDateDesc(User user);

    @Query("SELECT uoh FROM UserOrderHistory uoh WHERE uoh.user = :user AND uoh.hourOfDay = :hour")
    List<UserOrderHistory> findByUserAndHourOfDay(@Param("user") User user, @Param("hour") Integer hour);

    @Query("SELECT uoh FROM UserOrderHistory uoh WHERE uoh.user = :user AND uoh.orderDate >= :startDate")
    List<UserOrderHistory> findByUserAndOrderDateAfter(@Param("user") User user, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT DISTINCT uoh.product FROM UserOrderHistory uoh WHERE uoh.user = :user")
    List<Product> findDistinctProductsByUser(@Param("user") User user);

    @Query("SELECT COUNT(uoh) FROM UserOrderHistory uoh WHERE uoh.user = :user")
    Long countByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(uoh.orderValue), 0.0) FROM UserOrderHistory uoh WHERE uoh.user = :user")
    Double sumOrderValueByUser(@Param("user") User user);
}