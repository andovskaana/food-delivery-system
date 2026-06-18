package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.CourierDto;
import com.example.food_delivery.dto.domain.DisplayCourierDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.OrderDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.service.application.CourierApplicationService;
import com.example.food_delivery.service.application.OrderApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/couriers")
public class CourierController {

    private final CourierApplicationService courierApplicationService;
    private final OrderApplicationService orderApplicationService;

    public CourierController(CourierApplicationService courierApplicationService,
                             OrderApplicationService orderApplicationService) {
        this.courierApplicationService = courierApplicationService;
        this.orderApplicationService = orderApplicationService;
    }

    @GetMapping
    public ResponseEntity<List<DisplayCourierDto>> findAll() {
        return ResponseEntity.ok(courierApplicationService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisplayCourierDto> findById(@PathVariable Long id) {
        return courierApplicationService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/add")
    public ResponseEntity<CourierDto> save(@RequestBody CourierDto createCourier) {
        return ResponseEntity.ok(courierApplicationService.save(createCourier));
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<CourierDto> update(@PathVariable Long id,
                                             @RequestBody CourierDto createCourier) {
        return courierApplicationService.update(id, BasicMappers.fromDto(createCourier))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<CourierDto> deleteById(@PathVariable Long id) {
        return courierApplicationService.deleteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Assign THIS courier to an order.
     * The algorithm must have previously offered this order to the courier.
     * Uses optimistic locking at service level to prevent race conditions.
     */
    @PostMapping("/assign/{orderId}")
    public ResponseEntity<DisplayOrderDto> assignToOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.assignToOrder(user.getUsername(), orderId));
    }

    @PostMapping("/complete/{orderId}")
    public ResponseEntity<DisplayOrderDto> completeDelivery(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.completeDelivery(user.getUsername(), orderId));
    }

    /**
     * Returns orders offered to THIS courier by the algorithm.
     * These are the only orders this courier can accept.
     */
    @GetMapping("/my-available-orders")
    public ResponseEntity<List<OrderDto>> getMyAvailableOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.getOfferedOrders(user.getUsername()));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDto>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.findOrdersForCourier(user.getUsername()));
    }

    @GetMapping("/my-delivered-orders")
    public ResponseEntity<List<OrderDto>> getMyDeliveredOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.findDeliveredOrders(user.getUsername()));
    }

    /**
     * Customer rates a courier after delivery.
     * POST /api/couriers/rate/{orderId}  body: {"rating": 4}
     */
    @PostMapping("/rate/{orderId}")
    public ResponseEntity<Void> rateCourier(
            @PathVariable Long orderId,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal User user) {
        Integer rating = body.get("rating");
        if (rating == null) {
            return ResponseEntity.badRequest().build();
        }
        courierApplicationService.rateCourier(user.getUsername(), orderId, rating);
        return ResponseEntity.ok().build();
    }
}
