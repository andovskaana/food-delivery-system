package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierOrderOffer;
import com.example.food_delivery.model.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourierOrderOfferRepository extends JpaRepository<CourierOrderOffer, Long> {

    boolean existsByCourierAndOrder(Courier courier, Order order);

    Optional<CourierOrderOffer> findByCourierAndOrder(Courier courier, Order order);

    List<CourierOrderOffer> findByOrder(Order order);

    @Query("SELECT o FROM CourierOrderOffer o WHERE o.courier.user.username = :username")
    List<CourierOrderOffer> findByUsername(@Param("username") String username);

    void deleteByOrder(Order order);
}
