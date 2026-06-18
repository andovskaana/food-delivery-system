package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.LoginUserRequestDto;
import com.example.food_delivery.dto.domain.LoginUserResponseDto;
import com.example.food_delivery.dto.domain.RegisterUserRequestDto;
import com.example.food_delivery.dto.domain.RegisterUserResponseDto;
import com.example.food_delivery.helpers.JwtHelper;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.UserApplicationService;
import com.example.food_delivery.service.domain.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserApplicationServiceImpl implements UserApplicationService {

    private final UserService userService;
    private final JwtHelper jwtHelper;

    public UserApplicationServiceImpl(UserService userService, JwtHelper jwtHelper) {
        this.userService = userService;
        this.jwtHelper = jwtHelper;
    }

    @Override
    public Optional<RegisterUserResponseDto> register(RegisterUserRequestDto registerUserRequestDto) {
        User user = userService.register(registerUserRequestDto.toUser());
        RegisterUserResponseDto displayUserDto = RegisterUserResponseDto.from(user);
        return Optional.of(displayUserDto);
    }

    @Override
    public Optional<LoginUserResponseDto> login(LoginUserRequestDto loginUserRequestDto) {
        User user = userService.login(loginUserRequestDto.username(), loginUserRequestDto.password());

        String token = jwtHelper.generateToken(user);

        return Optional.of(new LoginUserResponseDto(token));
    }

    @Override
    public Optional<RegisterUserResponseDto> findByUsername(String username) {
        return userService
                .findByUsername(username)
                .map(RegisterUserResponseDto::from);
    }

    @Override
    public List<RegisterUserResponseDto> findAll() {
        return userService.findAll().stream().map(RegisterUserResponseDto::from).toList();
    }

    @Override
    public User save(User user) {
        return userService.save(user);
    }

    @Override
    public Optional<User> update(String username, User user) {
        return userService.update(username,user);
    }

    @Override
    public Optional<User> deleteById(String username) {
        return userService.deleteById(username);
    }

    @Override
    public User changePassword(String username, String newPassword) {
        return userService.changePassword(username,newPassword);
    }

}
