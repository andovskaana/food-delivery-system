package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Address;
import com.example.food_delivery.model.domain.Order;

import java.util.List;
import java.util.Optional;

public interface OrderService {
    List<Order> findAll();

    Optional<Order> findById(Long id);
    Optional<Order> findPending(String username);

    Order findOrCreatePending(String username);

    Optional<Order> confirm(String username);

    Optional<Order> cancel(String username);

    List<Order> findConfirmed();

    List<Order> findOrdersForCourier(String username);
    List<Order> findConfirmedOrdersForCustomer(String username);
    Optional<Order> updateAddress(Long id, Address deliveryAddress);
    Order save(Order order);
}
