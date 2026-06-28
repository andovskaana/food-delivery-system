package com.example.food_delivery.util;

import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.PromotionRequest;

import java.util.List;
import java.util.Optional;

public final class PromotionDiscountCalculator {

    private PromotionDiscountCalculator() {
    }

    public record PromotionPrice(Double discountPercent, Double discountedPrice, String promotionName) {
    }

    public static Optional<PromotionPrice> bestFor(Product product, List<PromotionRequest> promotions) {
        double originalPrice = product != null && product.getPrice() != null ? product.getPrice() : 0.0;
        if (originalPrice <= 0 || promotions == null || promotions.isEmpty()) {
            return Optional.empty();
        }

        Double bestPrice = null;
        String bestName = null;

        for (PromotionRequest promotion : promotions) {
            Double discounted = discountedPrice(originalPrice, promotion);
            if (discounted == null) {
                continue;
            }
            if (discounted < 0) {
                discounted = 0.0;
            }
            if (bestPrice == null || discounted < bestPrice) {
                bestPrice = discounted;
                bestName = promotion.getPromotionName();
            }
        }

        if (bestPrice == null || bestPrice >= originalPrice) {
            return Optional.empty();
        }

        double roundedPrice = round2(bestPrice);
        double effectivePercent = Math.round((1.0 - roundedPrice / originalPrice) * 100.0);
        return Optional.of(new PromotionPrice(effectivePercent, roundedPrice, bestName));
    }

    public static double bestUnitPrice(Product product, List<PromotionRequest> promotions) {
        double originalPrice = product != null && product.getPrice() != null ? product.getPrice() : 0.0;
        return bestFor(product, promotions)
                .map(PromotionPrice::discountedPrice)
                .orElse(originalPrice);
    }

    private static Double discountedPrice(double originalPrice, PromotionRequest promotion) {
        if (promotion == null) {
            return null;
        }
        if (promotion.getDiscountPercent() != null && promotion.getDiscountPercent() > 0) {
            return originalPrice * (1.0 - promotion.getDiscountPercent() / 100.0);
        }
        if (promotion.getDiscountAmount() != null && promotion.getDiscountAmount() > 0) {
            return originalPrice - promotion.getDiscountAmount();
        }
        return null;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
