package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_order_history")
public class UserOrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_username")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(optional = false)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double price;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    @Column(name = "hour_of_day")
    private Integer hourOfDay;

    @Column(name = "day_of_week", length = 20)
    private String dayOfWeek;

    @Column(name = "order_value", nullable = false)
    private Double orderValue;

    public UserOrderHistory(User user, Product product, Restaurant restaurant,
                            Integer quantity, Double price, LocalDateTime orderDate,
                            Integer hourOfDay, String dayOfWeek, Double orderValue) {
        this.user = user;
        this.product = product;
        this.restaurant = restaurant;
        this.quantity = quantity;
        this.price = price;
        this.orderDate = orderDate;
        this.hourOfDay = hourOfDay;
        this.dayOfWeek = dayOfWeek;
        this.orderValue = orderValue;
    }
}
