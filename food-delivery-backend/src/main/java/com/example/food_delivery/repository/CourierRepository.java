package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Courier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourierRepository extends JpaRepository<Courier, Long> {
    @Query("SELECT c FROM Courier c JOIN c.user u WHERE u.username = :courierUsername")
    Optional<Courier> findByUser_Username(@Param("courierUsername") String courierUsername);

    @Query("SELECT c FROM Courier c WHERE c.active = true")
    List<Courier> findAllActiveCouriers();

}
