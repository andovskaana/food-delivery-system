package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.enums.Role;
import com.example.food_delivery.model.exceptions.IncorrectPasswordException;
import com.example.food_delivery.model.exceptions.UsernameAlreadyExistsException;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.domain.UserService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

   private final UserRepository userRepository;
   private final PasswordEncoder passwordEncoder;
   private final CourierRepository courierRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, CourierRepository courierRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.courierRepository = courierRepository;
    }

    @Override
    @Transactional
    public User register(User dto) {
        if (findByUsername(dto.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException(dto.getUsername());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());

        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new IncorrectPasswordException();
        return user;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User save(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        if (user.getRole()==Role.ROLE_COURIER) {
            Courier courier = new Courier();
            courier.setUser(savedUser);
            courierRepository.save(courier);
        }

        return savedUser;
    }

    @Override
    public Optional<User> update(String username, User user) {
        return userRepository.findByUsername(username)
                .map(existingUser -> {
                    existingUser.setName(user.getName());
                    existingUser.setSurname(user.getSurname());
                    existingUser.setRole(user.getRole());
                    existingUser.setEmail(user.getEmail());
                    existingUser.setPhone(user.getPhone());
                    if (user.getPassword() != null && !user.getPassword().isBlank()) {
                        existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
                    }
                    return userRepository.save(existingUser);
                });
    }

    @Override
    public Optional<User> deleteById(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        user.ifPresent(userRepository::delete);
        return user;
    }

    @Override
    public User changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username).orElseThrow();
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository
                .findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }

}
