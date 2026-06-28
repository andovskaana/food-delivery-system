package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.DisplayPromotionDto;
import com.example.food_delivery.repository.PromotionRequestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionRequestRepository promotionRepository;

    public PromotionController(PromotionRequestRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    /** Public/customer endpoint: all approved, active and currently valid owner promotions. */
    @GetMapping("/active")
    public ResponseEntity<List<DisplayPromotionDto>> getActivePromotions() {
        List<DisplayPromotionDto> result = promotionRepository.findAllActive(Instant.now()).stream()
                .map(DisplayPromotionDto::from)
                .toList();
        return ResponseEntity.ok(result);
    }

    /** Public/customer endpoint: approved, active and currently valid offers for one restaurant. */
    @GetMapping("/active/restaurants/{restaurantId}")
    public ResponseEntity<List<DisplayPromotionDto>> getActivePromotionsForRestaurant(
            @PathVariable Long restaurantId) {
        List<DisplayPromotionDto> result = promotionRepository.findActiveByRestaurantId(restaurantId, Instant.now()).stream()
                .map(DisplayPromotionDto::from)
                .toList();
        return ResponseEntity.ok(result);
    }
}
