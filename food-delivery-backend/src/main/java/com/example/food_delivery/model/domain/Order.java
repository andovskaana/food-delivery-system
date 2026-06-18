package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    @ManyToOne
    private Courier courier;

    // Legacy field for compatibility with existing UI (flat list of Products)
    @ManyToMany
    private List<Product> Products = new ArrayList<>();

    // New canonical order items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Totals & fees
    private Double subtotal = 0.0;
    private Double deliveryFee = 0.0;
    private Double platformFee = 0.0;
    private Double discount = 0.0;
    private Double total = 0.0;

    @Embedded
    private Address deliveryAddress;

    @ManyToOne
    private Restaurant restaurant;

    private Instant placedAt;
    private LocalDateTime deliveredAt;

    public Order(User user) {
        this.user = user;
        this.status = OrderStatus.PENDING;
    }

    public Order(Long id, User user, OrderStatus status, List<Product> products, List<OrderItem> items, Double subtotal, Double deliveryFee, Double platformFee, Double discount, Double total, Address deliveryAddress, Restaurant restaurant, Instant placedAt) {
        this.id = id;
        this.user = user;
        this.status = status;
        Products = products;
        this.items = items;
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.platformFee = platformFee;
        this.discount = discount;
        this.total = total;
        this.deliveryAddress = deliveryAddress;
        this.restaurant = restaurant;
        this.placedAt = placedAt;
    }

    public Order() {
    }

    public void confirm() {
        this.status = OrderStatus.CONFIRMED;
        this.placedAt = Instant.now();
    }

    public void cancel() {
        this.status = OrderStatus.CANCELED;
    }

    public void recalcTotals() {
        double sub = 0.0;
        if (items != null && !items.isEmpty()) {
            for (OrderItem it : items) {
                sub += it.getLineTotal();
            }
        } else if (Products != null && !Products.isEmpty()) {
            for (Product d : Products) {
                sub += (d.getPrice() != null ? d.getPrice() : 0.0);
            }
        }
        subtotal = round2(sub);
        double totalCalc = subtotal + (deliveryFee != null ? deliveryFee : 0.0) + (platformFee != null ? platformFee : 0.0) - (discount != null ? discount : 0.0);
        total = round2(Math.max(totalCalc, 0.0));
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
