package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.enums.Role;

public record RegisterUserResponseDto(
        String username,
        String name,
        String surname,
        String email,
        String phone,
        Role role
) {

    public static RegisterUserResponseDto from(User user) {
        return new RegisterUserResponseDto(
                user.getUsername(),
                user.getName(),
                user.getSurname(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }

}
