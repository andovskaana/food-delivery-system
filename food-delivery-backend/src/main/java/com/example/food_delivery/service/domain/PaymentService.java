package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Payment;

public interface PaymentService {
    Payment createOrUpdateIntent(Order order);
    Payment markSucceeded(Payment payment);
    Payment markFailed(Payment payment, String reason);
}
