package com.example.food_delivery.model.enums;

public enum OrderStatus {
    PENDING,            // cart
    CONFIRMED,          // paid
    PICKED_UP,          // courier accepted and picked up
    DELIVERED,
    CANCELED
}
