package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.GroupOrder;
import com.example.food_delivery.model.enums.GroupOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GroupOrderRepository extends JpaRepository<GroupOrder, Long> {

    Optional<GroupOrder> findByGroupCode(String groupCode);

    boolean existsByOrderId(Long orderId);

    Optional<GroupOrder> findByOrderId(Long orderId);

    @Query("SELECT DISTINCT go FROM GroupOrder go LEFT JOIN go.participants p " +
           "WHERE go.createdBy.username = :username OR p.user.username = :username " +
           "ORDER BY go.createdAt DESC")
    List<GroupOrder> findAllForUser(@Param("username") String username);

    @Query("SELECT DISTINCT go FROM GroupOrder go LEFT JOIN go.participants p " +
           "WHERE (go.createdBy.username = :username OR p.user.username = :username) " +
           "AND go.status IN :statuses ORDER BY go.createdAt DESC")
    List<GroupOrder> findAllForUserAndStatusIn(@Param("username") String username,
                                                @Param("statuses") Collection<GroupOrderStatus> statuses);
}
