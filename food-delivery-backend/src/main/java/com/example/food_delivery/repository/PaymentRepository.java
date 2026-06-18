package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Payment;
import com.example.food_delivery.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrder(Order order);
    long countByStatus(PaymentStatus status);
}
