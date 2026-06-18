package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.ChangeRequestStatus;
import com.example.food_delivery.model.enums.ChangeRequestType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

/**
 * Stores a pending change request from a restaurant owner.
 * An admin must approve it before changes take effect.
 *
 * The payload JSON contains the proposed field values.
 * For RESTAURANT_UPDATE: {"name":"...", "description":"...", etc.}
 * For PRODUCT_ADD/UPDATE: {"name":"...", "price":..., "description":"...", etc.}
 * For PRODUCT_DELETE: {"productId": ...}
 * For PROMOTION: see PromotionRequest entity instead.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "owner_change_requests")
public class OwnerChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_username")
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    /** For product changes, the target product id (null for ADD) */
    private Long targetProductId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    /** JSON payload with proposed values */
    @Column(columnDefinition = "TEXT")
    private String payload;

    private String rejectionReason;

    private Instant createdAt = Instant.now();
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_username")
    private User reviewedBy;

    public OwnerChangeRequest(User requester, Restaurant restaurant, ChangeRequestType type, String payload) {
        this.requester = requester;
        this.restaurant = restaurant;
        this.type = type;
        this.payload = payload;
        this.createdAt = Instant.now();
    }
}
