package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.User;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;
import java.util.Optional;

public interface UserService extends UserDetailsService {
    User register(User user);

    User login(String username, String password);
    Optional<User> findByUsername(String username);
    List<User> findAll();
    User save(User user);

    Optional<User> update(String username, User user);

    Optional<User> deleteById(String username);
    User changePassword(String username, String newPassword);
}
