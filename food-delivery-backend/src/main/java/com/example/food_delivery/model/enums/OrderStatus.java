package com.example.food_delivery.model.enums;

public enum OrderStatus {
    PENDING,            // cart
    CONFIRMED,          // paid
    ACCEPTED_BY_RESTAURANT,
    IN_PREPARATION,
    READY_FOR_PICKUP,
    PICKED_UP,
    EN_ROUTE,
    DELIVERED,
    CANCELED
}
