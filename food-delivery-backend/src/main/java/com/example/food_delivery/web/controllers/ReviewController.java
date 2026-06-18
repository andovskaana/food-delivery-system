package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.ReviewDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.ReviewApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewApplicationService reviewApplicationService;

    public ReviewController(ReviewApplicationService reviewApplicationService) {
        this.reviewApplicationService = reviewApplicationService;
    }

    @PostMapping("/{restaurantId}")
    public ResponseEntity<ReviewDto> add(@PathVariable Long restaurantId,
                                         @AuthenticationPrincipal User user,
                                         @RequestParam int rating,
                                         @RequestParam(required = false) String comment) {
        return ResponseEntity.ok(reviewApplicationService.add(restaurantId, user.getUsername(), rating, comment));
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<List<ReviewDto>> list(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewApplicationService.list(restaurantId));
    }
}
