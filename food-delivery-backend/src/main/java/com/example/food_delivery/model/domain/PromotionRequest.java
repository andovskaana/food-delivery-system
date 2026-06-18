package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.ChangeRequestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A discount/promotion request created by a restaurant owner.
 * Requires admin approval before becoming visible to customers.
 *
 * Discount logic:
 *   - If discountPercent > 0, it's a % discount applied to the target price.
 *   - If discountAmount > 0, it's a fixed MKD discount.
 *   - scope: RESTAURANT = applies to all products in the restaurant
 *             PRODUCT = applies only to targetProduct
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "promotion_requests")
public class PromotionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_username")
    private User requester;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    /** Null = restaurant-wide promotion; non-null = specific product */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product targetProduct;

    private String promotionName;
    private String description;

    /** e.g. 20 means 20% off */
    private Double discountPercent;

    /** Fixed discount in MKD */
    private Double discountAmount;

    private Instant validFrom;
    private Instant validUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    /** Once approved, this flag marks the promotion as active */
    private Boolean active = false;

    private String rejectionReason;
    private Instant createdAt = Instant.now();
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_username")
    private User reviewedBy;
}
