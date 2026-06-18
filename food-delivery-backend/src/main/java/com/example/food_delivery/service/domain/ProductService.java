package com.example.food_delivery.service.domain;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Product;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    List<Product> findAll();

    Optional<Product> findById(Long id);

    Product save(Product menuItem);

    Optional<Product> update(Long id, Product menuItem);

    Optional<Product> deleteById(Long id);

    Order addToOrder(Product Product, Order order);

    Order removeFromOrder(Product Product, Order order);
}
