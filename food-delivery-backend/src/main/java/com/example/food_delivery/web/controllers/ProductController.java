package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.CreateProductDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.DisplayProductDetailsDto;
import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.ProductApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductApplicationService productApplicationService;

    public ProductController(
            ProductApplicationService productApplicationService
    ) {
        this.productApplicationService = productApplicationService;
    }

    @GetMapping
    public ResponseEntity<List<DisplayProductDto>> findAll() {
        return ResponseEntity.ok(productApplicationService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisplayProductDto> findById(@PathVariable Long id) {
        return productApplicationService
                .findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<DisplayProductDetailsDto> findByIdWithDetails(@PathVariable Long id) {
        return productApplicationService
                .findByIdWithDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @PostMapping("/add")
    public ResponseEntity<DisplayProductDto> save(@RequestBody CreateProductDto createMenuItemDto) {
        return ResponseEntity.ok(productApplicationService.save(createMenuItemDto));
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<DisplayProductDto> update(@PathVariable Long id, @RequestBody CreateProductDto createMenuItemDto) {
        return productApplicationService
                .update(id, createMenuItemDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<DisplayProductDto> deleteById(@PathVariable Long id) {
        return productApplicationService
                .deleteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/add-to-order/{id}")
    public ResponseEntity<DisplayOrderDto> addToOrder(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(productApplicationService.addToOrder(id, user.getUsername()));
    }

    @PostMapping("/remove-from-order/{id}")
    public ResponseEntity<DisplayOrderDto> removeFromOrder(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(productApplicationService.removeFromOrder(id, user.getUsername()));
    }

}
