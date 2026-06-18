package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.domain.UserOrderHistory;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.repository.UserOrderHistoryRepository;
import com.example.food_delivery.service.domain.TimeOfDayRecommendationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimeOfDayRecommendationServiceImpl implements TimeOfDayRecommendationService {

    private final UserOrderHistoryRepository userOrderHistoryRepository;
    private final ProductRepository productRepository;

    public TimeOfDayRecommendationServiceImpl(
            UserOrderHistoryRepository userOrderHistoryRepository,
            ProductRepository productRepository) {
        this.userOrderHistoryRepository = userOrderHistoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<Product> getTimeBasedRecommendations(User user) {
        int currentHour = LocalDateTime.now().getHour();

        List<Product> recommendations = getRecommendationsForSpecificWindow(user, currentHour, 0);
        if (!recommendations.isEmpty()) {
            return recommendations;
        }

        recommendations = getRecommendationsForSpecificWindow(user, currentHour, 2);
        if (!recommendations.isEmpty()) {
            return recommendations;
        }

        recommendations = getUserMostPopularProducts(user);
        if (!recommendations.isEmpty()) {
            return recommendations;
        }

        recommendations = getGlobalTimeBasedRecommendations(currentHour, 2);
        if (!recommendations.isEmpty()) {
            return recommendations;
        }

        return getGlobalMostPopularProducts();
    }

    @Override
    public List<Product> getRecommendationsForHour(User user, int hourOfDay) {
        return getRecommendationsForSpecificWindow(user, hourOfDay, 2);
    }

    private List<Product> getRecommendationsForSpecificWindow(User user, int targetHour, int windowHours) {
        if (targetHour < 0 || targetHour > 23) {
            return Collections.emptyList();
        }

        List<UserOrderHistory> allHistory = userOrderHistoryRepository.findByUser(user);
        if (allHistory.isEmpty()) {
            return Collections.emptyList();
        }

        List<UserOrderHistory> relevantOrders = filterOrdersByTimeWindow(allHistory, targetHour, windowHours);
        if (relevantOrders.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Double> productScores = calculateProductScores(relevantOrders, targetHour);

        return getTopProductsByScore(productScores, 10);
    }

    /**
     * Get user's most popular products (ignoring time)
     */
    private List<Product> getUserMostPopularProducts(User user) {
        List<UserOrderHistory> allHistory = userOrderHistoryRepository.findByUser(user);
        if (allHistory.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Integer> productFrequency = new HashMap<>();
        Map<Long, Integer> productTotalQuantity = new HashMap<>();

        for (UserOrderHistory order : allHistory) {
            Long productId = order.getProduct().getId();
            productFrequency.merge(productId, 1, Integer::sum);
            productTotalQuantity.merge(productId, order.getQuantity(), Integer::sum);
        }

        // Score = frequency × average quantity
        Map<Long, Double> productScores = new HashMap<>();
        for (Long productId : productFrequency.keySet()) {
            int frequency = productFrequency.get(productId);
            int totalQuantity = productTotalQuantity.get(productId);
            double avgQuantity = (double) totalQuantity / frequency;
            productScores.put(productId, frequency * avgQuantity);
        }

        return getTopProductsByScore(productScores, 10);
    }

    /**
     * Get what OTHER users order at this time (collaborative filtering)
     */
    private List<Product> getGlobalTimeBasedRecommendations(int targetHour, int windowHours) {
        if (targetHour < 0 || targetHour > 23) {
            return Collections.emptyList();
        }

        List<UserOrderHistory> allHistory = userOrderHistoryRepository.findAll();
        if (allHistory.isEmpty()) {
            return Collections.emptyList();
        }

        List<UserOrderHistory> relevantOrders = filterOrdersByTimeWindow(allHistory, targetHour, windowHours);
        if (relevantOrders.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Double> productScores = calculateGlobalProductScores(relevantOrders, targetHour);

        return getTopProductsByScore(productScores, 10);
    }

    /**
     * Get globally most popular products (all users, all time)
     */
    private List<Product> getGlobalMostPopularProducts() {
        List<UserOrderHistory> allHistory = userOrderHistoryRepository.findAll();
        if (allHistory.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Integer> productFrequency = new HashMap<>();
        Map<Long, Integer> productTotalQuantity = new HashMap<>();

        for (UserOrderHistory order : allHistory) {
            Long productId = order.getProduct().getId();
            productFrequency.merge(productId, 1, Integer::sum);
            productTotalQuantity.merge(productId, order.getQuantity(), Integer::sum);
        }

        // Score = frequency × total quantity (emphasize popularity)
        Map<Long, Double> productScores = new HashMap<>();
        for (Long productId : productFrequency.keySet()) {
            int frequency = productFrequency.get(productId);
            int totalQuantity = productTotalQuantity.get(productId);
            productScores.put(productId, (double) frequency * totalQuantity);
        }

        return getTopProductsByScore(productScores, 10);
    }

    /**
     * Filter orders by time window (handles midnight wrap-around)
     */
    private List<UserOrderHistory> filterOrdersByTimeWindow(
            List<UserOrderHistory> orders, int targetHour, int windowHours) {

        return orders.stream()
                .filter(order -> order.getHourOfDay() != null)
                .filter(order -> isWithinTimeWindow(order.getHourOfDay(), targetHour, windowHours))
                .collect(Collectors.toList());
    }

    /**
     * Check if hour is within time window (handles midnight wrap)
     */
    private boolean isWithinTimeWindow(int hour, int targetHour, int windowHours) {
        if (windowHours == 0) {
            return hour == targetHour;
        }

        int lowerBound = targetHour - windowHours;
        int upperBound = targetHour + windowHours;

        if (lowerBound < 0) {
            return hour >= (24 + lowerBound) || hour <= upperBound;
        } else if (upperBound >= 24) {
            return hour >= lowerBound || hour <= (upperBound - 24);
        } else {
            return hour >= lowerBound && hour <= upperBound;
        }
    }

    /**
     * Calculate product scores for personal recommendations
     */
    private Map<Long, Double> calculateProductScores(
            List<UserOrderHistory> orders, int targetHour) {

        Map<Long, Double> scores = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (UserOrderHistory order : orders) {
            Long productId = order.getProduct().getId();
            int quantity = order.getQuantity();

            double score = quantity;

            if (order.getHourOfDay() != null && order.getHourOfDay() == targetHour) {
                score *= 1.5;
            }

            long daysSinceOrder = ChronoUnit.DAYS.between(
                    order.getOrderDate().toLocalDate(),
                    now.toLocalDate()
            );

            if (daysSinceOrder <= 7) {
                score *= 1.3;  // Recent orders (last week)
            } else if (daysSinceOrder <= 30) {
                score *= 1.1;  // Somewhat recent (last month)
            }

            scores.merge(productId, score, Double::sum);
        }

        return scores;
    }

    /**
     * Calculate global product scores with diversity bonus
     */
    private Map<Long, Double> calculateGlobalProductScores(
            List<UserOrderHistory> orders, int targetHour) {

        Map<Long, Double> scores = new HashMap<>();
        Map<Long, Set<String>> productUsers = new HashMap<>(); // Track unique users per product
        LocalDateTime now = LocalDateTime.now();

        for (UserOrderHistory order : orders) {
            Long productId = order.getProduct().getId();
            String username = order.getUser().getUsername();
            int quantity = order.getQuantity();

            double score = quantity;

            // Hour match bonus
            if (order.getHourOfDay() != null && order.getHourOfDay() == targetHour) {
                score *= 1.5;
            }

            // Recency boost (less aggressive for global)
            long daysSinceOrder = ChronoUnit.DAYS.between(
                    order.getOrderDate().toLocalDate(),
                    now.toLocalDate()
            );

            if (daysSinceOrder <= 30) {
                score *= 1.2;
            }

            // Track unique users
            productUsers.computeIfAbsent(productId, k -> new HashSet<>()).add(username);

            scores.merge(productId, score, Double::sum);
        }

        // Apply diversity multiplier
        for (Map.Entry<Long, Set<String>> entry : productUsers.entrySet()) {
            Long productId = entry.getKey();
            int uniqueUsers = entry.getValue().size();

            if (uniqueUsers > 1) {
                // Boost products ordered by multiple users
                double diversityBonus = 1.0 + (Math.log(uniqueUsers) * 0.1);
                scores.computeIfPresent(productId, (k, v) -> v * diversityBonus);
            }
        }

        return scores;
    }

    /**
     * Get top N products by score (filters unavailable products)
     */
    private List<Product> getTopProductsByScore(Map<Long, Double> productScores, int limit) {
        List<Long> topProductIds = productScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit * 2) // Get more in case some are unavailable
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return productRepository.findAllById(topProductIds).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()))
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0)
                .limit(limit)
                .collect(Collectors.toList());
    }
}