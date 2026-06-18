package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Entity
public class Courier{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_username")
    private User user;

    private Boolean active = true;

    public Courier(User user, Boolean active) {
        this.user = user;
        this.active = active;
    }

    public Courier(User user, String phone, boolean active) {
        this.user = user;
        this.active = active;

        if (user != null) {
            user.setPhone(phone); // delegate phone to User
        }
    }

    public String getName() {
        return user != null ? user.getName() + " " + user.getSurname() : "";
    }
}
