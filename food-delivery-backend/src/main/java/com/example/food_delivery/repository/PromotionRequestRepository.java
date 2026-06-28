package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.PromotionRequest;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.enums.ChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PromotionRequestRepository extends JpaRepository<PromotionRequest, Long> {

    List<PromotionRequest> findByStatus(ChangeRequestStatus status);

    List<PromotionRequest> findByRestaurant(Restaurant restaurant);

    /** Active approved promotions for a restaurant (within validity period) */
    @Query("SELECT p FROM PromotionRequest p WHERE p.restaurant = :restaurant " +
           "AND p.status = 'APPROVED' AND p.active = true " +
           "AND (p.validUntil IS NULL OR p.validUntil > :now)")
    List<PromotionRequest> findActiveByRestaurant(
            @Param("restaurant") Restaurant restaurant,
            @Param("now") Instant now);

    /** Active approved promotions for a specific product */
    @Query("SELECT p FROM PromotionRequest p WHERE p.targetProduct = :product " +
           "AND p.status = 'APPROVED' AND p.active = true " +
           "AND (p.validUntil IS NULL OR p.validUntil > :now)")
    List<PromotionRequest> findActiveByProduct(
            @Param("product") Product product,
            @Param("now") Instant now);

    /** All active approved promotions (restaurant-wide and product-specific) currently valid */
    @Query("SELECT p FROM PromotionRequest p WHERE p.status = 'APPROVED' AND p.active = true " +
           "AND (p.validFrom IS NULL OR p.validFrom <= :now) " +
           "AND (p.validUntil IS NULL OR p.validUntil > :now)")
    List<PromotionRequest> findAllActive(@Param("now") Instant now);

    @Query("SELECT p FROM PromotionRequest p WHERE p.requester.username = :username")
    List<PromotionRequest> findByRequesterUsername(@Param("username") String username);
}
