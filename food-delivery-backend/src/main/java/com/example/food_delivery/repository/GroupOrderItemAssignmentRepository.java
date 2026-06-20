package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.GroupOrderItemAssignment;
import com.example.food_delivery.model.domain.GroupOrderParticipant;
import com.example.food_delivery.model.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupOrderItemAssignmentRepository extends JpaRepository<GroupOrderItemAssignment, Long> {
    List<GroupOrderItemAssignment> findByGroupOrderId(Long groupOrderId);
    List<GroupOrderItemAssignment> findByParticipant(GroupOrderParticipant participant);
    Optional<GroupOrderItemAssignment> findByGroupOrderIdAndOrderItemId(Long groupOrderId, Long orderItemId);
    boolean existsByGroupOrderIdAndOrderItemId(Long groupOrderId, Long orderItemId);
    void deleteByParticipant(GroupOrderParticipant participant);

    @Query("SELECT COALESCE(SUM(a.lineTotal), 0.0) FROM GroupOrderItemAssignment a WHERE a.participant = :participant")
    Double sumLineTotalByParticipant(@Param("participant") GroupOrderParticipant participant);
}
