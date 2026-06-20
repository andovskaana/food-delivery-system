package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.OrderApplicationService;
import com.example.food_delivery.service.domain.RfmPromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderApplicationService orderApplicationService;
    private final RfmPromotionService rfmPromotionService;

    public OrderController(OrderApplicationService orderApplicationService,
                           RfmPromotionService rfmPromotionService) {
        this.orderApplicationService = orderApplicationService;
        this.rfmPromotionService = rfmPromotionService;
    }

    @GetMapping("/confirmed")
    public ResponseEntity<List<OrderDto>> findConfirmed() {
        return ResponseEntity.ok(orderApplicationService.findAllConfirmed());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> findById(@PathVariable Long id) {
        return orderApplicationService
                .findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pending")
    public ResponseEntity<DisplayOrderDto> findOrCreatePending(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.findOrCreatePending(user.getUsername()));
    }

    @PutMapping("/pending/confirm")
    public ResponseEntity<OrderDto> confirm(@AuthenticationPrincipal User user) {
        return orderApplicationService
                .confirm(user.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/pending/cancel")
    public ResponseEntity<OrderDto> cancel(@AuthenticationPrincipal User user) {
        return orderApplicationService
                .cancel(user.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/track/{id}")
    public ResponseEntity<OrderDto> trackOrder(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return orderApplicationService
                .findById(id)
                .filter(order -> order.getUserUsername().equals(user.getUsername()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDto>> findActiveOrdersForCustomer(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.findConfirmedOrdersForCustomer(user.getUsername()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<OrderDto>> findDeliveredOrdersForCustomer(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.findDeliveredOrdersForCustomer(user.getUsername()));
    }

    @GetMapping("/cart")
    public ResponseEntity<OrderDto> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.getCart(user.getUsername()));
    }

    @PutMapping("/address/{id}")
    public ResponseEntity<OrderDto> updateAddress(
            @PathVariable Long id,
            @RequestBody AddressDto address) {
        OrderDto updated = orderApplicationService.setDeliveryAddress(id,address);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/apply-coupon")
    public ResponseEntity<ApplyCouponResponseDto> applyCoupon(
            @AuthenticationPrincipal User user,
            @RequestBody ApplyCouponRequestDto request) {
        OrderDto cart = orderApplicationService.getCart(user.getUsername());
        Double subtotal = cart.getSubtotal() != null ? cart.getSubtotal() : 0.0;
        ApplyCouponResponseDto response = rfmPromotionService.validateCoupon(
                user, request.couponCode(), subtotal);
        if (Boolean.TRUE.equals(response.success()) && response.discountAmount() != null) {
            orderApplicationService.applyDiscount(user.getUsername(), response.discountAmount());
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/remove-coupon")
    public ResponseEntity<Void> removeCoupon(@AuthenticationPrincipal User user) {
        orderApplicationService.applyDiscount(user.getUsername(), 0.0);
        return ResponseEntity.ok().build();
    }
}
