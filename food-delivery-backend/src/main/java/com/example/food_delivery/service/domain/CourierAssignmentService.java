package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.Order;

import java.util.List;

/**
 * Selects the best set of eligible couriers to be offered a specific order.
 * The algorithm considers:
 *   1. Courier is active (not busy)
 *   2. Courier has no low rating from this customer
 *   3. Distance / score ranking
 */
public interface CourierAssignmentService {

    /**
     * Run the assignment algorithm for the given order.
     * Saves CourierOrderOffer records for selected couriers.
     * Returns the list of couriers who were offered this order.
     */
    List<Courier> offerOrderToCouriers(Order order);

    /**
     * Returns the orders currently visible to this courier
     * (i.e. orders for which a CourierOrderOffer exists for them).
     */
    List<Order> getOfferedOrdersForCourier(String courierUsername);

    /**
     * Verify that this courier is allowed to accept this order.
     */
    boolean isCourierEligibleForOrder(String courierUsername, Long orderId);
}
