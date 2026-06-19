package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierOrderOffer;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.OrderStatus;
import com.example.food_delivery.model.enums.SkopjeZone;
import com.example.food_delivery.repository.CourierOrderOfferRepository;
import com.example.food_delivery.repository.CourierRatingRepository;
import com.example.food_delivery.repository.CourierRepository;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.service.domain.CourierAssignmentService;
import com.example.food_delivery.util.ZoneDistanceMatrix;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Zone-based courier assignment (push model, no GPS).
 *
 * Each courier has a currentZone (set once per shift from a dropdown).
 * Each restaurant has a fixed zone (set when created).
 * ZoneDistanceMatrix gives an estimated travel time between any two zones.
 *
 * When an order is confirmed, the algorithm scores all active couriers and
 * offers it to the top 3. No further input needed from the courier — proximity
 * is fully automatic from their zone.
 *
 * Scoring (max ~100):
 *   Base       : 40 pts
 *   Rating     : avgRating × 6, max 30 pts (new couriers: 15 neutral)
 *   Proximity  : max(0, 30 − zoneMinutes × 1.5)  — zoneMinutes from ZoneDistanceMatrix
 *   Tiebreaker : random 0–5 pts
 */
@Service
public class CourierAssignmentServiceImpl implements CourierAssignmentService {

    private static final int MAX_OFFERS = 3;

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

        Set<Long> blockedIds = courierRatingRepository
                .findCouriersRatedLowByCustomer(customerUsername,
                        com.example.food_delivery.model.domain.CourierRating.LOW_RATING_THRESHOLD)
                .stream().map(Courier::getId).collect(Collectors.toSet());

        List<Courier> candidates = courierRepository.findAllActiveCouriers().stream()
                .filter(c -> !blockedIds.contains(c.getId()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) return Collections.emptyList();

        SkopjeZone restaurantZone = order.getRestaurant() != null ? order.getRestaurant().getZone() : null;

        Random rnd = new Random();
        Map<Courier, double[]> scoreMap = new LinkedHashMap<>(); // [0]=total [1]=rating [2]=proximity [3]=tiebreak [4]=zoneMinutes

        for (Courier courier : candidates) {
            double base = 40.0;

            Double avgRating = courierRatingRepository.findAverageRatingByCourier(courier);
            double ratingPts = avgRating != null ? avgRating * 6.0 : 15.0;

            int zoneMinutes = ZoneDistanceMatrix.minutesBetween(courier.getCurrentZone(), restaurantZone);
            double proximityPts = Math.max(0.0, 30.0 - zoneMinutes * 1.5);

            double tiebreaker = rnd.nextDouble() * 5.0;
            double total = base + ratingPts + proximityPts + tiebreaker;

            scoreMap.put(courier, new double[]{total, ratingPts, proximityPts, tiebreaker, zoneMinutes});
        }

        List<Courier> selected = candidates.stream()
                .sorted((a, b) -> Double.compare(scoreMap.get(b)[0], scoreMap.get(a)[0]))
                .limit(MAX_OFFERS)
                .collect(Collectors.toList());

        for (Courier courier : selected) {
            if (!offerRepository.existsByCourierAndOrder(courier, order)) {
                double[] pts = scoreMap.get(courier);
                Double avgRating = courierRatingRepository.findAverageRatingByCourier(courier);
                String breakdown = String.format(
                        "Base: 40 | Rating: %.1f (avg=%.2f) | Proximity: %.1f (%s→%s, ~%.0f min) | Tiebreaker: %.1f | Total: %.1f",
                        pts[1],
                        avgRating != null ? avgRating : -1.0,
                        pts[2],
                        courier.getCurrentZone() != null ? courier.getCurrentZone() : "UNKNOWN",
                        restaurantZone != null ? restaurantZone : "UNKNOWN",
                        pts[4],
                        pts[3], pts[0]);
                offerRepository.save(new CourierOrderOffer(courier, order, pts[0], breakdown));
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
                .anyMatch(o -> o.getOrder().getId().equals(orderId));
    }
}
