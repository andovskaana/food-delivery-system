package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.Order;

import java.util.List;
import java.util.Optional;

public interface CourierService {

    List<Courier> findAll();

    Optional<Courier> findById(Long id);

    Optional<Courier> findByUsername(String username);

    Courier save(Courier courier);

    Optional<Courier> update(Long id, Courier courier);

    Optional<Courier> deleteById(Long id);

    /**
     * Assign a courier to an order.
     * Validates that:
     *   1. The courier was offered this order by the algorithm.
     *   2. No other courier has already accepted it (race condition guard).
     */
    Order assignToOrder(String courierUsername, Long orderId);

    Order completeDelivery(String courierUsername, Long orderId);

    List<Courier> findAvailable();

    List<Order> findDeliveredOrders(String courierUsername);

    /** Orders offered to this courier that are still CONFIRMED */
    List<Order> getOfferedOrders(String courierUsername);

    /** Rate a courier after delivery */
    void rateCourier(String customerUsername, Long orderId, Integer rating);
}
