package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.GroupPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupPaymentRepository extends JpaRepository<GroupPayment, Long> {
}
