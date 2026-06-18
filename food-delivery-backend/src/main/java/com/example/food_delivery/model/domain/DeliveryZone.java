package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class DeliveryZone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double radiusKm; // simple circular zone
    @Embedded
    private Coordinates center;

    private Double deliveryFee; // in your currency

    @ManyToOne(optional = false)
    private Restaurant restaurant;
}
