package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.Order;

import java.util.List;

public interface CourierAssignmentService {
    /** Push model: run algorithm on order confirm, offer to top 3 couriers */
    List<Courier> offerOrderToCouriers(Order order);

    /** Orders this courier has been offered (can accept) */
    List<Order> getOfferedOrdersForCourier(String courierUsername);

    /** Whether this courier is eligible to accept this order */
    boolean isCourierEligibleForOrder(String courierUsername, Long orderId);
}
