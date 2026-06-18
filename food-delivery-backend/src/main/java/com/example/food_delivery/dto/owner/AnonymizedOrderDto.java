package com.example.food_delivery.dto.owner;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.enums.OrderStatus;
import com.example.food_delivery.model.enums.PaymentStatus;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Order data exposed to the restaurant owner.
 * Customer personal info is anonymized (only anonymous ID exposed).
 */
public record AnonymizedOrderDto(
        Long orderId,
        String restaurantName,
        String anonymizedCustomerId,   // e.g. "CUST-7f3a" — no real name/email
        OrderStatus status,
        List<OrderItemSummary> items,
        Double total,
        Instant placedAt,
        String deliveryArea,            // only city/area, not full address
        String paymentStatus
) {
    public record OrderItemSummary(String productName, int quantity, double unitPrice) {}

    public static AnonymizedOrderDto from(Order o) {
        String anonId = "CUST-" + Integer.toHexString(o.getUser().getUsername().hashCode()).substring(0, 4);
        String area = (o.getDeliveryAddress() != null) ? o.getDeliveryAddress().getCity() : null;

        List<OrderItemSummary> items = o.getItems().stream()
                .map(it -> new OrderItemSummary(
                        it.getProduct().getName(),
                        it.getQuantity(),
                        it.getUnitPriceSnapshot()))
                .collect(Collectors.toList());

        return new AnonymizedOrderDto(
                o.getId(),
                o.getRestaurant() != null ? o.getRestaurant().getName() : null,
                anonId,
                o.getStatus(),
                items,
                o.getTotal(),
                o.getPlacedAt(),
                area,
                null // payment status could be fetched separately
        );
    }
}
