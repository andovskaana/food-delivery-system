package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private Double price;

    private Integer quantity;

    @ManyToOne
    private Restaurant restaurant;

    // marketplace additions DALI DA SE DODADAT VO KONSTRUKTOR I OPSTO?
    private Boolean isAvailable = true;
    private String category="";
    private String imageUrl="";

    public Product() {
    }

    public Product(String name, String description, Double price, Integer quantity, Restaurant restaurant) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.restaurant = restaurant;
    }

    public Product(String name, String description, Double price, Integer quantity, Restaurant restaurant, String category, String imageUrl) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.restaurant = restaurant;
        this.category = category;
        this.imageUrl = imageUrl;
    }

    public void increaseQuantity(){ if (quantity == null) quantity = 0;
    quantity += 1;
    }

    public void decreaseQuantity() {
        if (quantity == null) quantity = 0;
        if (quantity <= 0) throw new IllegalStateException("Out of stock for Product " + id);
        quantity -= 1;
    }
}
