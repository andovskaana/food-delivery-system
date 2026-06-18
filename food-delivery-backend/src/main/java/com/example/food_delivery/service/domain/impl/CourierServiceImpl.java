package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierRating;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.OrderStatus;
import com.example.food_delivery.repository.CourierOrderOfferRepository;
import com.example.food_delivery.repository.CourierRatingRepository;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.service.domain.CourierAssignmentService;
import com.example.food_delivery.service.domain.CourierService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CourierServiceImpl implements CourierService {

    private final CourierRepository courierRepository;
    private final OrderRepository orderRepository;
    private final CourierAssignmentService assignmentService;
    private final CourierOrderOfferRepository offerRepository;
    private final CourierRatingRepository ratingRepository;

    public CourierServiceImpl(CourierRepository courierRepository,
                              OrderRepository orderRepository,
                              CourierAssignmentService assignmentService,
                              CourierOrderOfferRepository offerRepository,
                              CourierRatingRepository ratingRepository) {
        this.courierRepository = courierRepository;
        this.orderRepository = orderRepository;
        this.assignmentService = assignmentService;
        this.offerRepository = offerRepository;
        this.ratingRepository = ratingRepository;
    }

    @Override
    public List<Courier> findAll() { return courierRepository.findAll(); }

    @Override
    public Optional<Courier> findById(Long id) { return courierRepository.findById(id); }

    @Override
    public Optional<Courier> findByUsername(String username) {
        return courierRepository.findByUser_Username(username);
    }

    @Override
    public Courier save(Courier courier) { return courierRepository.save(courier); }

    @Override
    public Optional<Courier> update(Long id, Courier courier) {
        return courierRepository.findById(id).map(existing -> {
            existing.setActive(courier.getActive());
            return courierRepository.save(existing);
        });
    }

    @Override
    public Optional<Courier> deleteById(Long id) {
        Optional<Courier> courier = courierRepository.findById(id);
        courier.ifPresent(courierRepository::delete);
        return courier;
    }

    @Override
    @Transactional
    public Order assignToOrder(String courierUsername, Long orderId) {
        Courier courier = courierRepository.findByUser_Username(courierUsername)
                .orElseThrow(() -> new RuntimeException("Courier not found"));

        if (!courier.getActive()) {
            throw new RuntimeException("You are already delivering another order");
        }

        // *** Algorithm enforcement: only offered couriers can accept ***
        if (!assignmentService.isCourierEligibleForOrder(courierUsername, orderId)) {
            throw new RuntimeException("This order was not offered to you");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Race condition guard: re-check status inside transaction
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new RuntimeException("Order is no longer available (already accepted by another courier)");
        }

        // Assign
        courier.setActive(false);
        order.setStatus(OrderStatus.PICKED_UP);
        order.setCourier(courier);

        courierRepository.save(courier);
        Order saved = orderRepository.save(order);

        // Remove all offers for this order so other couriers no longer see it
        offerRepository.deleteByOrder(order);

        return saved;
    }

    @Override
    @Transactional
    public Order completeDelivery(String courierUsername, Long orderId) {
        Courier courier = courierRepository.findByUser_Username(courierUsername)
                .orElseThrow(() -> new RuntimeException("Courier not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCourier().getId().equals(courier.getId())) {
            throw new RuntimeException("This order is not assigned to you");
        }

        courier.setActive(true);
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());

        courierRepository.save(courier);
        return orderRepository.save(order);
    }

    @Override
    public List<Courier> findAvailable() {
        return courierRepository.findAllActiveCouriers();
    }

    @Override
    public List<Order> findDeliveredOrders(String courierUsername) {
        return orderRepository.findByCourierUsernameAndDelivered(courierUsername);
    }

    @Override
    public List<Order> getOfferedOrders(String courierUsername) {
        return assignmentService.getOfferedOrdersForCourier(courierUsername);
    }

    @Override
    @Transactional
    public void rateCourier(String customerUsername, Long orderId, Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getUsername().equals(customerUsername)) {
            throw new RuntimeException("You can only rate couriers from your own orders");
        }
        if (order.getCourier() == null) {
            throw new RuntimeException("No courier assigned to this order");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Can only rate after delivery is complete");
        }

        Courier courier = order.getCourier();

        // Check if already rated
        ratingRepository.findByCourierAndCustomerAndOrderId(courier, order.getUser(), orderId)
                .ifPresent(r -> { throw new RuntimeException("You already rated this courier for this order"); });

        CourierRating cr = new CourierRating(courier, order.getUser(), order, rating);
        ratingRepository.save(cr);
    }
}
