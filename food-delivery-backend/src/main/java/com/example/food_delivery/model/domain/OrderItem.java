package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Order order;

    @ManyToOne(optional = false)
    private Product Product;

    private Integer quantity = 1;

    private Double unitPriceSnapshot;

    public Double getLineTotal() {
        double price = unitPriceSnapshot != null ? unitPriceSnapshot : (Product != null ? Product.getPrice() : 0.0);
        int qty = quantity != null ? quantity : 0;
        return price * qty;
    }
}
