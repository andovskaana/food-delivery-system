package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.GroupOrderStatus;
import com.example.food_delivery.model.enums.GroupSplitType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "group_orders")
public class GroupOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true)
    private Order order;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "group_code", nullable = false, unique = true, length = 32)
    private String groupCode;

    @Column(name = "invite_token", nullable = false, unique = true, length = 64)
    private String inviteToken;

    @Column(name = "split_count", nullable = false)
    private Integer splitCount;

    // Nullable column with a default so ddl-auto=update can add it to an
    // already-populated table without failing on a NOT NULL constraint.
    @Enumerated(EnumType.STRING)
    @Column(name = "split_type", length = 20)
    private GroupSplitType splitType = GroupSplitType.EQUAL;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount = 0.0;

    @Column(name = "paid_amount", nullable = false)
    private Double paidAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupOrderStatus status = GroupOrderStatus.WAITING_FOR_PARTICIPANTS;

    // timestamptz so the TTL window stops skewing in UTC+2 (Skopje).
    @Column(name = "created_at", updatable = false, nullable = false, columnDefinition = "timestamptz")
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false, columnDefinition = "timestamptz")
    private Instant expiresAt;

    @Column(name = "finalized_at", columnDefinition = "timestamptz")
    private Instant finalizedAt;

    @Version
    private Long version;

    @OneToMany(mappedBy = "groupOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupOrderParticipant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "groupOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupOrderItemAssignment> itemAssignments = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        // Fallback only. The service now sets expiresAt explicitly from
        // app.group.ttl-hours, so this 24h default is just a safety net.
        if (expiresAt == null) {
            expiresAt = createdAt.plus(24, java.time.temporal.ChronoUnit.HOURS);
        }
    }
}
