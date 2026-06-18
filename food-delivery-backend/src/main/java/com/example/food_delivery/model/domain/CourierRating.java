package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A customer's rating of a specific courier after a delivery.
 * If rating <= LOW_RATING_THRESHOLD, the courier will be excluded
 * from future orders placed by this customer.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "courier_ratings")
public class CourierRating {

    /** Couriers rated at or below this value by a customer are excluded from that customer's future orders */
    public static final int LOW_RATING_THRESHOLD = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "courier_id")
    private Courier courier;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_username")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    /** 1–5 rating */
    private Integer rating;

    private Instant createdAt = Instant.now();

    public CourierRating(Courier courier, User customer, Order order, Integer rating) {
        this.courier = courier;
        this.customer = customer;
        this.order = order;
        this.rating = rating;
        this.createdAt = Instant.now();
    }
}
