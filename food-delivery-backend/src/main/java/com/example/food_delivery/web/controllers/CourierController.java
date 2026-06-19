package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.CourierDto;
import com.example.food_delivery.dto.domain.DisplayCourierDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.OrderDto;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.enums.SkopjeZone;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.service.application.CourierApplicationService;
import com.example.food_delivery.service.application.OrderApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/couriers")
public class CourierController {

    private final CourierApplicationService courierApplicationService;
    private final OrderApplicationService orderApplicationService;
    private final CourierRepository courierRepository;

    public CourierController(CourierApplicationService courierApplicationService,
                             OrderApplicationService orderApplicationService,
                             CourierRepository courierRepository) {
        this.courierApplicationService = courierApplicationService;
        this.orderApplicationService = orderApplicationService;
        this.courierRepository = courierRepository;
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
    public ResponseEntity<CourierDto> save(@RequestBody CourierDto dto) {
        return ResponseEntity.ok(courierApplicationService.save(dto));
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<CourierDto> update(@PathVariable Long id, @RequestBody CourierDto dto) {
        return courierApplicationService.update(id, BasicMappers.fromDto(dto))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<CourierDto> deleteById(@PathVariable Long id) {
        return courierApplicationService.deleteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Orders offered to this courier by the algorithm */
    @GetMapping("/my-available-orders")
    public ResponseEntity<List<OrderDto>> getMyAvailableOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.getOfferedOrders(user.getUsername()));
    }

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

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDto>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderApplicationService.findOrdersForCourier(user.getUsername()));
    }

    @GetMapping("/my-delivered-orders")
    public ResponseEntity<List<OrderDto>> getMyDeliveredOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courierApplicationService.findDeliveredOrders(user.getUsername()));
    }

    @PostMapping("/rate/{orderId}")
    public ResponseEntity<Void> rateCourier(
            @PathVariable Long orderId,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal User user) {
        Integer rating = body.get("rating");
        if (rating == null) return ResponseEntity.badRequest().build();
        courierApplicationService.rateCourier(user.getUsername(), orderId, rating);
        return ResponseEntity.ok().build();
    }

    /**
     * Courier sets their current zone for this shift.
     * PUT /api/couriers/my-zone  body: {"zone": "CENTAR"}
     */
    @PutMapping("/my-zone")
    public ResponseEntity<Map<String, Object>> updateMyZone(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        return courierRepository.findByUser_Username(user.getUsername()).map(courier -> {
            String zoneStr = body.get("zone");
            SkopjeZone zone = (zoneStr == null || zoneStr.isBlank()) ? null : SkopjeZone.valueOf(zoneStr);
            courier.setCurrentZone(zone);
            courierRepository.save(courier);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("zone", courier.getCurrentZone());
            result.put("message", "Zone updated");
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** List of available zones for the dropdown */
    @GetMapping("/zones")
    public ResponseEntity<SkopjeZone[]> getZones() {
        return ResponseEntity.ok(SkopjeZone.values());
    }
}
