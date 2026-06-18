package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Tracks which couriers have been offered a specific order by the assignment algorithm.
 * Only couriers with a record here can accept the corresponding order.
 */
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

    public CourierOrderOffer(Courier courier, Order order) {
        this.courier = courier;
        this.order = order;
        this.offeredAt = Instant.now();
    }
}
