package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.enums.Role;

public record RegisterUserRequestDto(
        String username,
        String password,
        String name,
        String surname,
        String email,
        String phone,
        Role role
) {

    public User toUser() {
        return new User(username, password, name, surname,phone, email,role);
    }

}
