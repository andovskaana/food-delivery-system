package com.example.food_delivery.model.enums;

public enum OrderStatus {
    PENDING,            // active cart
    GROUP_OPEN,         // cart converted into an unpaid group order; user can start another cart
    CONFIRMED,          // paid and sent to restaurant/couriers
    ACCEPTED_BY_RESTAURANT,
    IN_PREPARATION,
    READY_FOR_PICKUP,
    PICKED_UP,
    EN_ROUTE,
    DELIVERED,
    CANCELED
}
