package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.OwnerChangeRequest;
import com.example.food_delivery.model.enums.ChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OwnerChangeRequestRepository extends JpaRepository<OwnerChangeRequest, Long> {

    List<OwnerChangeRequest> findByStatus(ChangeRequestStatus status);

    @Query("SELECT r FROM OwnerChangeRequest r WHERE r.restaurant.id = :restaurantId")
    List<OwnerChangeRequest> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT r FROM OwnerChangeRequest r WHERE r.requester.username = :username")
    List<OwnerChangeRequest> findByRequesterUsername(@Param("username") String username);
}
