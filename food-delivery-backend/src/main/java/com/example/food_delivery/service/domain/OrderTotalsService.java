package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Restaurant;

public interface OrderTotalsService {
    void setFeesAndRecalculate(Order order, Restaurant restaurant);
}
