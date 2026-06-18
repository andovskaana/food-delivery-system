package com.example.food_delivery.dto.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourierDto {
    private String username;  // user username for lookup
    private String name;
    private String phone;
    private Boolean active;
}
