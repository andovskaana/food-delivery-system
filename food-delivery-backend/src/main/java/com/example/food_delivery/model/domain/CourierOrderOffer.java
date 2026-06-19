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
@Table(name = "courier_order_offers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"courier_id", "order_id"}))
public class CourierOrderOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "courier_id")
    private Courier courier;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private Instant offeredAt = Instant.now();

    /** Score assigned by the algorithm when this offer was created */
    private Double score;

    /** Human-readable score breakdown, shown in admin audit */
    private String scoreBreakdown;

    public CourierOrderOffer(Courier courier, Order order) {
        this.courier = courier;
        this.order = order;
        this.offeredAt = Instant.now();
    }

    public CourierOrderOffer(Courier courier, Order order, double score, String scoreBreakdown) {
        this.courier = courier;
        this.order = order;
        this.offeredAt = Instant.now();
        this.score = score;
        this.scoreBreakdown = scoreBreakdown;
    }
}
