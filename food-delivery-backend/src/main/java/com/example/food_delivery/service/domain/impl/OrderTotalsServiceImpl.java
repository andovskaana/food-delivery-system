package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.dto.domain.FreeDeliveryInfoDto;
import com.example.food_delivery.model.domain.DeliveryZone;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.domain.OrderTotalsService;
import com.example.food_delivery.service.domain.RfmPromotionService;
import org.springframework.stereotype.Service;

@Service
public class OrderTotalsServiceImpl implements OrderTotalsService {

    // Simplified fee rules; you can move these to props/db later
    private static final double PLATFORM_FEE = 0.05; // 5%
    private static final double DEFAULT_DELIVERY_FEE = 50.0; // Default delivery fee in MKD

    private final RfmPromotionService rfmPromotionService;

    public OrderTotalsServiceImpl(RfmPromotionService rfmPromotionService) {
        this.rfmPromotionService = rfmPromotionService;
    }

    @Override
    public void setFeesAndRecalculate(Order order, Restaurant restaurant) {
        double baseDeliveryFee;

        // Get base delivery fee from restaurant zone or use default
        if (restaurant != null && !restaurant.getDeliveryZones().isEmpty()) {
            DeliveryZone z = restaurant.getDeliveryZones().get(0);
            baseDeliveryFee = z.getDeliveryFee() != null ? z.getDeliveryFee() : DEFAULT_DELIVERY_FEE;
        } else {
            baseDeliveryFee = DEFAULT_DELIVERY_FEE;
        }

        // Check if user qualifies for free delivery based on RFM segment
        User user = order.getUser();
        double subtotal = order.getSubtotal() != null ? order.getSubtotal() : 0.0;

        if (user != null) {
            try {
                FreeDeliveryInfoDto deliveryInfo = rfmPromotionService.getFreeDeliveryInfo(user, subtotal);

                if (deliveryInfo != null && Boolean.TRUE.equals(deliveryInfo.isFree())) {
                    // User qualifies for free delivery (VIP or threshold met)
                    order.setDeliveryFee(0.0);
                } else {
                    order.setDeliveryFee(baseDeliveryFee);
                }

                // Apply segment-based discount if not already applied
                if (order.getDiscount() == null || order.getDiscount() == 0.0) {
                    int discountPercent = rfmPromotionService.getDiscountForUser(user);
                    if (discountPercent > 0) {
                        double discountAmount = round2(subtotal * discountPercent / 100.0);
                        order.setDiscount(discountAmount);
                    }
                }
            } catch (Exception e) {
                // If RFM service fails, use base delivery fee
                System.err.println("RFM service error, using default fees: " + e.getMessage());
                order.setDeliveryFee(baseDeliveryFee);
            }
        } else {
            order.setDeliveryFee(baseDeliveryFee);
        }

        order.setPlatformFee(round2(subtotal * PLATFORM_FEE));
        order.recalcTotals();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
