package com.example.food_delivery.model.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Coordinates {
    private Double lat;
    private Double lng;
}
