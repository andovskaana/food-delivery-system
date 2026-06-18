package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Extends a User with ROLE_RESTAURANT_OWNER to track which restaurants they own.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "restaurant_owners")
public class RestaurantOwner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_username")
    private User user;

    @ManyToMany
    @JoinTable(
            name = "owner_restaurant_map",
            joinColumns = @JoinColumn(name = "owner_id"),
            inverseJoinColumns = @JoinColumn(name = "restaurant_id")
    )
    private List<Restaurant> restaurants = new ArrayList<>();

    public RestaurantOwner(User user) {
        this.user = user;
    }
}
