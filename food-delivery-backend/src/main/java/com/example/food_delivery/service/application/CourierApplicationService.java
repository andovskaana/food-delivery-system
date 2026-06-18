package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.CourierDto;
import com.example.food_delivery.dto.domain.DisplayCourierDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.OrderDto;
import com.example.food_delivery.model.domain.Courier;

import java.util.List;
import java.util.Optional;

public interface CourierApplicationService {

    List<DisplayCourierDto> findAll();

    Optional<DisplayCourierDto> findById(Long id);

    CourierDto save(CourierDto dto);

    Optional<CourierDto> update(Long id, Courier courier);

    Optional<CourierDto> deleteById(Long id);

    DisplayOrderDto assignToOrder(String username, Long orderId);

    DisplayOrderDto completeDelivery(String username, Long orderId);

    List<OrderDto> findDeliveredOrders(String username);

    /** Offers currently visible to this courier (from algorithm) */
    List<OrderDto> getOfferedOrders(String username);

    /** Rate a courier after delivery */
    void rateCourier(String customerUsername, Long orderId, Integer rating);
}
