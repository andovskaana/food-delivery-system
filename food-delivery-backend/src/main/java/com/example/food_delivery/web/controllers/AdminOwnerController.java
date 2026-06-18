package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.owner.ChangeRequestDto;
import com.example.food_delivery.dto.owner.PromotionRequestDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.domain.RestaurantOwnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin endpoints for reviewing owner change and promotion requests.
 */
@RestController
@RequestMapping("/api/admin/owner-requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOwnerController {

    private final RestaurantOwnerService ownerService;

    public AdminOwnerController(RestaurantOwnerService ownerService) {
        this.ownerService = ownerService;
    }

    /** List all pending change requests */
    @GetMapping("/changes/pending")
    public ResponseEntity<List<ChangeRequestDto>> getPendingChanges() {
        return ResponseEntity.ok(
                ownerService.getPendingChangeRequests().stream()
                        .map(ChangeRequestDto::from)
                        .collect(Collectors.toList())
        );
    }

    /** Approve a change request */
    @PostMapping("/changes/{id}/approve")
    public ResponseEntity<ChangeRequestDto> approveChange(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ChangeRequestDto.from(
                ownerService.approveChangeRequest(id, admin.getUsername())));
    }

    /** Reject a change request */
    @PostMapping("/changes/{id}/reject")
    public ResponseEntity<ChangeRequestDto> rejectChange(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User admin) {
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(ChangeRequestDto.from(
                ownerService.rejectChangeRequest(id, admin.getUsername(), reason)));
    }

    /** List all pending promotion requests */
    @GetMapping("/promotions/pending")
    public ResponseEntity<List<PromotionRequestDto>> getPendingPromotions() {
        return ResponseEntity.ok(
                ownerService.getPendingPromotions().stream()
                        .map(PromotionRequestDto::from)
                        .collect(Collectors.toList())
        );
    }

    /** Approve a promotion */
    @PostMapping("/promotions/{id}/approve")
    public ResponseEntity<PromotionRequestDto> approvePromotion(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(PromotionRequestDto.from(
                ownerService.approvePromotion(id, admin.getUsername())));
    }

    /** Reject a promotion */
    @PostMapping("/promotions/{id}/reject")
    public ResponseEntity<PromotionRequestDto> rejectPromotion(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User admin) {
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(PromotionRequestDto.from(
                ownerService.rejectPromotion(id, admin.getUsername(), reason)));
    }
}
