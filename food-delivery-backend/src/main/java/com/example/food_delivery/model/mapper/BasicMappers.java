package com.example.food_delivery.model.mapper;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.*;

import java.util.List;
import java.util.stream.Collectors;

public final class BasicMappers {
    private BasicMappers() {}

    // ===== Address =====
    public static AddressDto toDto(Address a) {
        if (a == null) return null;
        AddressDto d = new AddressDto();
        d.setLine1(a.getLine1());
        d.setLine2(a.getLine2());
        d.setCity(a.getCity());
        d.setPostalCode(a.getPostalCode());
        d.setCountry(a.getCountry());
        return d;
    }

    public static Address fromDto(AddressDto d) {
        if (d == null) return null;
        return new Address(d.getLine1(), d.getLine2(), d.getCity(), d.getPostalCode(), d.getCountry());
    }

    // ===== Coordinates =====
    public static CoordinatesDto toDto(Coordinates c) {
        if (c == null) return null;
        CoordinatesDto d = new CoordinatesDto();
        d.setLat(c.getLat());
        d.setLng(c.getLng());
        return d;
    }

    public static Coordinates fromDto(CoordinatesDto d) {
        if (d == null) return null;
        return new Coordinates(d.getLat(), d.getLng());
    }

    // ===== DeliveryZone =====
    public static DeliveryZoneDto toDto(DeliveryZone z) {
        if (z == null) return null;
        DeliveryZoneDto d = new DeliveryZoneDto();
        d.setId(z.getId());
        d.setName(z.getName());
        d.setRadiusKm(z.getRadiusKm());
        d.setCenter(toDto(z.getCenter()));
        d.setDeliveryFee(z.getDeliveryFee());
        return d;
    }

    public static List<DeliveryZoneDto> toZoneDtos(List<DeliveryZone> zones) {
        return zones == null ? null : zones.stream().map(BasicMappers::toDto).collect(Collectors.toList());
    }



    // ===== OrderItem =====
    public static OrderItemDto toDto(OrderItem it) {
        if (it == null) return null;
        OrderItemDto d = new OrderItemDto();
        d.setId(it.getId());
        if (it.getProduct() != null) {
            d.setProductId(it.getProduct().getId());
            d.setProductName(it.getProduct().getName());
            d.setImageUrl(it.getProduct().getImageUrl());
        }
        d.setQuantity(it.getQuantity());
        d.setUnitPriceSnapshot(it.getUnitPriceSnapshot());
        d.setLineTotal(it.getLineTotal());
        return d;
    }

    public static List<OrderItemDto> toItemDtos(List<OrderItem> items) {
        return items == null ? null : items.stream().map(BasicMappers::toDto).collect(Collectors.toList());
    }

    // ===== Order =====
    public static OrderDto toDto(Order o) {
        if (o == null) return null;
        OrderDto d = new OrderDto();
        d.setId(o.getId());
        d.setUserUsername(o.getUser() != null ? o.getUser().getUsername() : null);
        d.setStatus(o.getStatus() != null ? o.getStatus().name() : null);
        d.setSubtotal(o.getSubtotal());
        d.setRestaurantId(o.getRestaurant().getId());
        d.setRestaurantName(o.getRestaurant().getName());
        d.setProducts( DisplayProductDto.from(o.getProducts()));
        d.setItems(toItemDtos(o.getItems()));
        d.setDeliveryFee(o.getDeliveryFee());
        d.setPlatformFee(o.getPlatformFee());
        d.setDeliveryAddress(BasicMappers.toDto(o.getDeliveryAddress()));
        d.setDiscount(o.getDiscount());
        d.setCourier(o.getCourier());
        d.setTotal(o.getTotal());
        d.setPlacedAt(o.getPlacedAt());
        d.setDeliveredAt(o.getDeliveredAt());
        return d;
    }

    // ===== Payment =====
    public static PaymentDto toDto(Payment p) {
        if (p == null) return null;
        PaymentDto d = new PaymentDto();
        d.setId(p.getId());
        d.setOrderId(p.getOrder() != null ? p.getOrder().getId() : null);
        d.setProvider(p.getProvider() != null ? p.getProvider().name() : null);
        d.setStatus(p.getStatus() != null ? p.getStatus().name() : null);
        d.setAmount(p.getAmount());
        d.setCurrency(p.getCurrency());
        d.setProviderIntentId(p.getProviderIntentId());
        d.setCreatedAt(p.getCreatedAt());
        d.setUpdatedAt(p.getUpdatedAt());
        return d;
    }

    // ===== Courier =====
    public static CourierDto toDto(Courier c) {
        if (c == null) return null;
        CourierDto d = new CourierDto();
        d.setName(c.getName());
        d.setActive(c.getActive());
        return d;
    }

    public static Courier fromDto(CourierDto dto) {
        if (dto == null) return null;

        Courier courier = new Courier();
        courier.setActive(dto.getActive());
        return courier;
    }

    // ===== Review =====
    public static ReviewDto toDto(Review r) {
        if (r == null) return null;
        ReviewDto d = new ReviewDto();
        d.setId(r.getId());
        d.setRestaurantId(r.getRestaurant() != null ? r.getRestaurant().getId() : null);
        d.setUserUsername(r.getUser() != null ? r.getUser().getUsername() : null);
        d.setRating(r.getRating());
        d.setComment(r.getComment());
        d.setCreatedAt(r.getCreatedAt());
        return d;
    }

    // ===== Convenience aliases used by application services =====
    public static DisplayCourierDto toDisplayDto(Courier c) {
        return c == null ? null : DisplayCourierDto.from(c);
    }

    /** Alias so application services can call toOrderDto as well as toDto */
    public static OrderDto toOrderDto(Order o) {
        return toDto(o);
    }

    public static DisplayOrderDto toDisplayDto(Order o) {
        return o == null ? null : DisplayOrderDto.from(o);
    }

}
