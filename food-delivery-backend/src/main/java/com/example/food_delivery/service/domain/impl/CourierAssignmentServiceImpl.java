package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierOrderOffer;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.OrderStatus;
import com.example.food_delivery.repository.CourierOrderOfferRepository;
import com.example.food_delivery.repository.CourierRatingRepository;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.service.domain.CourierAssignmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Simple but realistic courier assignment algorithm.
 *
 * Scoring (higher = better):
 *   + 40 pts  : courier is active (not busy) — required
 *   + up to 30 pts : average rating (rating * 6, max 30)
 *   - 0 pts  : excluded if customer gave this courier a rating <= 2
 *
 * Distance bonus: if restaurant coordinates available, couriers within 5 km get +30 pts,
 * otherwise ignored (treated as equidistant).
 *
 * The top MAX_OFFERS_PER_ORDER couriers receive offers.
 */
@Service
public class CourierAssignmentServiceImpl implements CourierAssignmentService {

    /** How many couriers receive the offer simultaneously */
    private static final int MAX_OFFERS_PER_ORDER = 3;

    /** Haversine radius in km below which a courier gets the distance bonus */
    private static final double NEAR_DISTANCE_KM = 5.0;

    private final CourierRepository courierRepository;
    private final CourierRatingRepository courierRatingRepository;
    private final CourierOrderOfferRepository offerRepository;
    private final OrderRepository orderRepository;

    public CourierAssignmentServiceImpl(CourierRepository courierRepository,
                                        CourierRatingRepository courierRatingRepository,
                                        CourierOrderOfferRepository offerRepository,
                                        OrderRepository orderRepository) {
        this.courierRepository = courierRepository;
        this.courierRatingRepository = courierRatingRepository;
        this.offerRepository = offerRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public List<Courier> offerOrderToCouriers(Order order) {
        String customerUsername = order.getUser().getUsername();

        // Get couriers the customer has low-rated (blocked from this customer's orders)
        List<Courier> blockedCouriers = courierRatingRepository
                .findCouriersRatedLowByCustomer(customerUsername,
                        com.example.food_delivery.model.domain.CourierRating.LOW_RATING_THRESHOLD);
        Set<Long> blockedIds = blockedCouriers.stream()
                .map(Courier::getId)
                .collect(Collectors.toSet());

        // All active couriers not blocked
        List<Courier> candidates = courierRepository.findAllActiveCouriers().stream()
                .filter(c -> !blockedIds.contains(c.getId()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Score and rank
        Double restLat = (order.getRestaurant() != null && order.getRestaurant().getCoordinates() != null)
                ? order.getRestaurant().getCoordinates().getLat() : null;
        Double restLng = (order.getRestaurant() != null && order.getRestaurant().getCoordinates() != null)
                ? order.getRestaurant().getCoordinates().getLng() : null;

        Map<Courier, Double> scores = new HashMap<>();
        for (Courier courier : candidates) {
            double score = 40.0; // base for being active

            // Rating bonus
            Double avgRating = courierRatingRepository.findAverageRatingByCourier(courier);
            if (avgRating != null) {
                score += avgRating * 6.0; // max 30 pts for rating=5
            } else {
                score += 15.0; // neutral for new couriers (assume mid rating)
            }

            // Distance bonus (simplified: use courier's last known location if stored; else skip)
            // We don't store courier GPS in this project, so we skip distance and give equal chance.
            // If restaurant coords are available and courier had coords, we'd compute haversine.
            // For now: all equidistant, small random tiebreaker for fairness.
            score += new Random().nextDouble() * 5.0;

            scores.put(courier, score);
        }

        // Sort descending by score, take top N
        List<Courier> selected = candidates.stream()
                .sorted((a, b) -> Double.compare(scores.getOrDefault(b, 0.0), scores.getOrDefault(a, 0.0)))
                .limit(MAX_OFFERS_PER_ORDER)
                .collect(Collectors.toList());

        // Persist offers
        for (Courier courier : selected) {
            if (!offerRepository.existsByCourierAndOrder(courier, order)) {
                offerRepository.save(new CourierOrderOffer(courier, order));
            }
        }

        return selected;
    }

    @Override
    public List<Order> getOfferedOrdersForCourier(String courierUsername) {
        return offerRepository.findByUsername(courierUsername).stream()
                .map(CourierOrderOffer::getOrder)
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isCourierEligibleForOrder(String courierUsername, Long orderId) {
        return offerRepository.findByUsername(courierUsername).stream()
                .anyMatch(offer -> offer.getOrder().getId().equals(orderId));
    }

    /** Haversine distance in km between two lat/lng pairs (for future use) */
    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
