package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.domain.UserOrderHistory;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.repository.UserOrderHistoryRepository;
import com.example.food_delivery.service.domain.PopularMenuRecommendationService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of {@link PopularMenuRecommendationService} that calculates
 * globally popular menu items by analysing order history across all users.
 *
 * <p>The algorithm operates in the following way:</p>
 * <ul>
 *     <li>Fetch all user order history records from the repository.</li>
 *     <li>Filter the records to only consider those placed within the last
 *         30 days. This ensures that recommendations reflect recent trends.</li>
 *     <li>For each order, calculate a base score equal to the quantity
 *         ordered. Apply a recency boost: orders in the last 7 days are
 *         weighted more heavily than those between 8 and 30 days.</li>
 *     <li>Track the set of unique users who ordered each product to
 *         encourage diversity: products ordered by many unique users receive
 *         a multiplicative bonus based on the logarithm of the number of
 *         distinct customers.</li>
 *     <li>Sum the scores per product and select the top N products by
 *         aggregated score. Only products that are currently available and
 *         have remaining quantity are returned.</li>
 * </ul>
 */
@Service
public class PopularMenuRecommendationServiceImpl implements PopularMenuRecommendationService {

    private final UserOrderHistoryRepository userOrderHistoryRepository;
    private final ProductRepository productRepository;

    public PopularMenuRecommendationServiceImpl(
            UserOrderHistoryRepository userOrderHistoryRepository,
            ProductRepository productRepository) {
        this.userOrderHistoryRepository = userOrderHistoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<Product> getPopularRecommendations(User user) {
        // Fetch all order history records
        List<UserOrderHistory> allHistory = userOrderHistoryRepository.findAll();
        if (allHistory.isEmpty()) {
            return Collections.emptyList();
        }

        // Define a cutoff date for recency (e.g. last 30 days)
        LocalDate cutoffDate = LocalDate.now().minusDays(30);

        Map<Long, Double> productScores = new HashMap<>();
        Map<Long, Set<String>> productUserSet = new HashMap<>();

        LocalDate today = LocalDate.now();

        for (UserOrderHistory order : allHistory) {
            LocalDate orderDate = order.getOrderDate().toLocalDate();
            if (orderDate.isBefore(cutoffDate)) {
                // Skip orders older than cutoff
                continue;
            }
            Long productId = order.getProduct().getId();
            int quantity = order.getQuantity() != null ? order.getQuantity() : 1;
            String username = order.getUser().getUsername();

            // Base score is quantity
            double score = quantity;

            // Recency boost: orders in last 7 days get higher weight
            long daysSinceOrder = ChronoUnit.DAYS.between(orderDate, today);
            if (daysSinceOrder <= 7) {
                score *= 1.3;
            } else if (daysSinceOrder <= 30) {
                score *= 1.1;
            }

            // Aggregate score per product
            productScores.merge(productId, score, Double::sum);

            // Track unique users
            productUserSet.computeIfAbsent(productId, k -> new HashSet<>()).add(username);
        }

        // Apply diversity bonus: products ordered by many distinct users get a boost
        for (Map.Entry<Long, Set<String>> entry : productUserSet.entrySet()) {
            Long productId = entry.getKey();
            int uniqueUsers = entry.getValue().size();
            if (uniqueUsers > 1) {
                double diversityBonus = 1.0 + (Math.log(uniqueUsers) * 0.1);
                productScores.computeIfPresent(productId, (k, v) -> v * diversityBonus);
            }
        }

        // Sort by score descending and collect top product IDs
        List<Long> topProductIds = productScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(20) // fetch more to filter out unavailable items later
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Fetch the product entities and filter by availability and stock
        return productRepository.findAllById(topProductIds).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()))
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0)
                .limit(10)
                .collect(Collectors.toList());
    }
}