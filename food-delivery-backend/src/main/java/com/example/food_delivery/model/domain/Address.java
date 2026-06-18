package com.example.food_delivery.model.domain;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Embeddable
public class Address {
    private String line1;
    private String line2;
    private String city;
    private String postalCode;
    private String country;

    public Address(String line1, String line2, String city, String postalCode, String country) {
        this.line1 = line1;
        this.line2 = line2;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
    }

    public Address(){}
}
