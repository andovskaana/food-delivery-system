package com.example.food_delivery.model.domain;

import com.example.food_delivery.model.enums.SkopjeZone;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Entity
public class Courier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_username")
    private User user;

    private Boolean active = true;

    /**
     * Courier's current zone, set once per shift via a dropdown.
     * No GPS — this is a simplified proxy used with ZoneDistanceMatrix
     * to estimate travel time to a restaurant's zone.
     * Null means the courier hasn't set their zone yet (treated as worst-case distance).
     */
    @Enumerated(EnumType.STRING)
    private SkopjeZone currentZone;

    public Courier(User user, Boolean active) {
        this.user = user;
        this.active = active;
    }

    public Courier(User user, String phone, boolean active) {
        this.user = user;
        this.active = active;
        if (user != null) user.setPhone(phone);
    }

    public String getName() {
        return user != null ? user.getName() + " " + user.getSurname() : "";
    }
}
