package com.example.food_delivery.dto.domain;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddressDto {
    private String line1;
    private String line2;
    private String city;
    private String postalCode;
    private String country;
}
