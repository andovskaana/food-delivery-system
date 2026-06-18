package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.CreateRestaurantDto;
import com.example.food_delivery.dto.domain.DisplayRestaurantDto;
import com.example.food_delivery.service.application.RestaurantApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantApplicationService restaurantApplicationService;

    public RestaurantController(RestaurantApplicationService restaurantApplicationService) {
        this.restaurantApplicationService = restaurantApplicationService;
    }

    @GetMapping
    public ResponseEntity<List<DisplayRestaurantDto>> findAll() {
        return ResponseEntity.ok(restaurantApplicationService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisplayRestaurantDto> findById(@PathVariable Long id) {
        return restaurantApplicationService
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/add")
    public ResponseEntity<DisplayRestaurantDto> save(@RequestBody CreateRestaurantDto createRestaurantDto) {
        return ResponseEntity.ok(restaurantApplicationService.save(createRestaurantDto));
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<DisplayRestaurantDto> update(
            @PathVariable Long id,
            @RequestBody CreateRestaurantDto createRestaurantDto
    ) {
        return restaurantApplicationService
                .update(id, createRestaurantDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<DisplayRestaurantDto> deleteById(@PathVariable Long id) {
        return restaurantApplicationService
                .deleteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
