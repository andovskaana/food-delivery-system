package com.example.food_delivery.dto.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class PaymentDto {
    private Long id;
    private Long orderId;
    private String provider;          // PaymentProvider as string
    private String status;            // PaymentStatus as string
    private Double amount;
    private String currency;
    private String providerIntentId;
    private String clientSecret; // added for Stripe
    private Instant createdAt;
    private Instant updatedAt;
}
