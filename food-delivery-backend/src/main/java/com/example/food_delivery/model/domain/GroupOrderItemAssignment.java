package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "group_order_item_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_group_order_item_assignment", columnNames = {"group_order_id", "order_item_id"})
        }
)
public class GroupOrderItemAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "group_order_id")
    private GroupOrder groupOrder;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    private GroupOrderParticipant participant;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "item_name")
    private String itemName;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "unit_price_snapshot", nullable = false)
    private Double unitPriceSnapshot = 0.0;

    @Column(name = "line_total", nullable = false)
    private Double lineTotal = 0.0;

    @Column(name = "assigned_at", updatable = false, nullable = false)
    private Instant assignedAt;

    @PrePersist
    public void prePersist() {
        if (assignedAt == null) {
            assignedAt = Instant.now();
        }
    }
}
