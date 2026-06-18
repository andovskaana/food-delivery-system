package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.UserApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserApplicationService userApplicationService;

    public UserController(UserApplicationService userApplicationService) {
        this.userApplicationService = userApplicationService;
    }

    @GetMapping("/{username}")
    public ResponseEntity<RegisterUserResponseDto> findByUsername(@PathVariable String username) {
        return userApplicationService
                .findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<RegisterUserResponseDto> me(@AuthenticationPrincipal User user) {
        return userApplicationService
                .findByUsername(user.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().build());
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterUserResponseDto> register(@RequestBody RegisterUserRequestDto registerUserRequestDto) {
        return userApplicationService
                .register(registerUserRequestDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().build());
    }

    @PostMapping("/login")
    public ResponseEntity<LoginUserResponseDto> login(@RequestBody LoginUserRequestDto loginUserRequestDto) {
        return userApplicationService
                .login(loginUserRequestDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<RegisterUserResponseDto>> findAll()
    {
        return ResponseEntity.ok(userApplicationService.findAll());
    }
    @PostMapping("/add")
    public ResponseEntity<User> save(@RequestBody User createUser) {
        return ResponseEntity.ok(userApplicationService.save(createUser));
    }

    @PutMapping("/edit/{username}")
    public ResponseEntity<User> update(
            @PathVariable String username,
            @RequestBody User createUser
    ) {
        return userApplicationService
                .update(username, createUser)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/delete/{username}")
    public ResponseEntity<User> deleteById(@PathVariable String username) {
        return userApplicationService
                .deleteById(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{username}/password")
    public ResponseEntity<User> changePassword(
            @PathVariable String username,
            @RequestBody PasswordDto dto
    ) {

        return ResponseEntity.ok(userApplicationService.changePassword(username, dto.password()));
    }

}
