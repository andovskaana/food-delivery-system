package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.GroupOrderParticipant;
import com.example.food_delivery.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupOrderParticipantRepository extends JpaRepository<GroupOrderParticipant, Long> {
    Optional<GroupOrderParticipant> findByPaymentToken(String paymentToken);
    long countByGroupOrderId(Long groupOrderId);
    long countByGroupOrderIdAndPaymentStatus(Long groupOrderId, PaymentStatus paymentStatus);
    boolean existsByGroupOrderIdAndPaymentStatus(Long groupOrderId, PaymentStatus paymentStatus);
    Optional<GroupOrderParticipant> findByGroupOrderIdAndUserUsername(Long groupOrderId, String username);
    Optional<GroupOrderParticipant> findByGroupOrderIdAndEmailIgnoreCase(Long groupOrderId, String email);
    List<GroupOrderParticipant> findByGroupOrderIdOrderByJoinedAtAsc(Long groupOrderId);
}
