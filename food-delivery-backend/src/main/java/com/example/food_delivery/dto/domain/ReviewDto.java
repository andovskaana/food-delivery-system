package com.example.food_delivery.dto.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ReviewDto {
    private Long id;
    private Long restaurantId;
    private String userUsername;
    private Integer rating;   // 1..5
    private String comment;
    private Instant createdAt;
}
