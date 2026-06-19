package com.example.food_delivery.web.controllers;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierOrderOffer;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.SkopjeZone;
import com.example.food_delivery.repository.CourierOrderOfferRepository;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/couriers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCourierController {

    private final CourierRepository courierRepository;
    private final CourierOrderOfferRepository offerRepository;
    private final OrderRepository orderRepository;

    public AdminCourierController(CourierRepository courierRepository,
                                  CourierOrderOfferRepository offerRepository,
                                  OrderRepository orderRepository) {
        this.courierRepository = courierRepository;
        this.offerRepository = offerRepository;
        this.orderRepository = orderRepository;
    }

    /** List all couriers with their zone and active status */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllCouriers() {
        List<Map<String, Object>> result = courierRepository.findAll().stream()
                .map(this::courierToMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Admin sets the zone for any courier */
    @PutMapping("/{courierId}/zone")
    public ResponseEntity<Map<String, Object>> setZone(
            @PathVariable Long courierId,
            @RequestBody Map<String, String> body) {
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Courier not found"));
        String zoneStr = body.get("zone");
        courier.setCurrentZone((zoneStr == null || zoneStr.isBlank()) ? null : SkopjeZone.valueOf(zoneStr));
        courierRepository.save(courier);
        return ResponseEntity.ok(courierToMap(courier));
    }

    /** Admin sets active status for any courier */
    @PutMapping("/{courierId}/active")
    public ResponseEntity<Map<String, Object>> setActive(
            @PathVariable Long courierId,
            @RequestBody Map<String, Object> body) {
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Courier not found"));
        courier.setActive(Boolean.parseBoolean(body.get("active").toString()));
        courierRepository.save(courier);
        return ResponseEntity.ok(courierToMap(courier));
    }

    /**
     * Order-level courier audit:
     * For every order that had offers, return who was offered, their score breakdown,
     * and who (if anyone) accepted.
     */
    @GetMapping("/order-audit")
    public ResponseEntity<List<Map<String, Object>>> getOrderAudit() {
        List<Order> allOrders = orderRepository.findAll();
        List<Map<String, Object>> audit = new ArrayList<>();

        for (Order order : allOrders) {
            List<CourierOrderOffer> offers = offerRepository.findByOrder(order);
            if (offers.isEmpty()) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("orderId", order.getId());
            entry.put("status", order.getStatus());
            entry.put("restaurantName", order.getRestaurant() != null ? order.getRestaurant().getName() : "—");
            entry.put("restaurantZone", order.getRestaurant() != null ? order.getRestaurant().getZone() : null);
            entry.put("placedAt", order.getPlacedAt());
            entry.put("total", order.getTotal());

            String acceptedBy = null;
            if (order.getCourier() != null) {
                acceptedBy = order.getCourier().getName() +
                        " (@" + order.getCourier().getUser().getUsername() + ")";
            }
            entry.put("acceptedBy", acceptedBy);

            List<Map<String, Object>> offerList = offers.stream()
                    .filter(o -> o.getCourier() != null)
                    .sorted(Comparator.comparingDouble(o -> -(o.getScore() != null ? o.getScore() : 0)))
                    .map(o -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("courierName", o.getCourier().getName());
                        m.put("courierUsername", o.getCourier().getUser().getUsername());
                        m.put("courierZone", o.getCourier().getCurrentZone());
                        m.put("score", o.getScore() != null ? Math.round(o.getScore() * 10.0) / 10.0 : null);
                        m.put("scoreBreakdown", o.getScoreBreakdown());
                        m.put("offeredAt", o.getOfferedAt());
                        boolean accepted = order.getCourier() != null &&
                                order.getCourier().getId().equals(o.getCourier().getId());
                        m.put("accepted", accepted);
                        return m;
                    }).collect(Collectors.toList());

            entry.put("offeredTo", offerList);
            entry.put("totalOffered", offerList.size());
            audit.add(entry);
        }

        audit.sort((a, b) -> Long.compare((Long) b.get("orderId"), (Long) a.get("orderId")));
        return ResponseEntity.ok(audit);
    }

    private Map<String, Object> courierToMap(Courier c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("username", c.getUser().getUsername());
        m.put("name", c.getName());
        m.put("phone", c.getUser().getPhone());
        m.put("active", c.getActive());
        m.put("currentZone", c.getCurrentZone());
        return m;
    }
}
