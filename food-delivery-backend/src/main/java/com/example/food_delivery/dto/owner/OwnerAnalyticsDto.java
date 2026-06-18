package com.example.food_delivery.dto.owner;

import java.util.List;
import java.util.Map;

/**
 * Analytics data for a restaurant owner.
 * All customer data is anonymized (no personal info).
 */
public record OwnerAnalyticsDto(
        Long restaurantId,
        String restaurantName,
        long totalOrders,
        double totalRevenue,
        double averageOrderValue,
        long cancelledOrders,
        List<ProductSales> topProducts,
        List<ProductSales> bottomProducts,
        Map<String, Long> ordersByDayOfWeek,
        Map<Integer, Long> ordersByHour,
        Map<String, Double> revenueByMonth
) {
    public record ProductSales(Long productId, String productName, long quantity, double revenue) {}
}
