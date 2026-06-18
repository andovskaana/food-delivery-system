package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.User;

import java.util.List;
import java.util.Optional;

public interface UserApplicationService {
    Optional<RegisterUserResponseDto> register(RegisterUserRequestDto registerUserRequestDto);

    Optional<LoginUserResponseDto> login(LoginUserRequestDto loginUserRequestDto);

    Optional<RegisterUserResponseDto> findByUsername(String username);
    List<RegisterUserResponseDto> findAll();
    User save(User user);

    Optional<User> update(String username, User user);

    Optional<User> deleteById(String username);
    User changePassword(String username, String newPassword);
}
