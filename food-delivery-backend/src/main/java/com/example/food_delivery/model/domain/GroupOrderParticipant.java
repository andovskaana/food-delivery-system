package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.PaymentStatus;
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
@Table(
        name = "group_order_participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_group_participant_user", columnNames = {"group_order_id", "user_id"})
        }
)
public class GroupOrderParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "group_order_id")
    private GroupOrder groupOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "email")
    private String email;

    @Column(name = "assigned_amount", nullable = false)
    private Double assignedAmount = 0.0;

    @Column(name = "paid_amount", nullable = false)
    private Double paidAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.REQUIRES_ACTION;

    @Column(name = "payment_token", nullable = false, unique = true, length = 64)
    private String paymentToken;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupOrderItemAssignment> itemAssignments = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }
}
