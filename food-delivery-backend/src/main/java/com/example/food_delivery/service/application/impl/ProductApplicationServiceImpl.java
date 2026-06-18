package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.CreateProductDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.DisplayProductDetailsDto;
import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.exceptions.ProductNotFoundException;
import com.example.food_delivery.model.exceptions.RestaurantNotFoundException;
import com.example.food_delivery.service.application.ProductApplicationService;
import com.example.food_delivery.service.domain.OrderService;
import com.example.food_delivery.service.domain.ProductService;
import com.example.food_delivery.service.domain.RestaurantService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductApplicationServiceImpl implements ProductApplicationService {

    private final ProductService productService;
    private final RestaurantService restaurantService;
    private final OrderService orderService;

    public ProductApplicationServiceImpl(ProductService productService, RestaurantService restaurantService, OrderService orderService) {
        this.productService = productService;
        this.restaurantService = restaurantService;
        this.orderService = orderService;
    }

    @Override
    public List<DisplayProductDto> findAll() {
        return DisplayProductDto.from(productService.findAll());
    }

    @Override
    public Optional<DisplayProductDto> findById(Long id) {
        return productService
                .findById(id)
                .map(DisplayProductDto::from);
    }

    @Override
    public Optional<DisplayProductDetailsDto> findByIdWithDetails(Long id) {
        return productService
                .findById(id)
                .map(DisplayProductDetailsDto::from);
    }

    @Override
    public DisplayProductDto save(CreateProductDto createProductDto) {
        Restaurant restaurant = restaurantService
                .findById(createProductDto.restaurantId())
                .orElseThrow(() -> new RestaurantNotFoundException(createProductDto.restaurantId()));
        return DisplayProductDto.from(productService.save(createProductDto.toProduct(restaurant)));
    }

    @Override
    public Optional<DisplayProductDto> update(Long id, CreateProductDto createProductDto) {
        Restaurant restaurant = restaurantService
                .findById(createProductDto.restaurantId())
                .orElseThrow(() -> new RestaurantNotFoundException(createProductDto.restaurantId()));
        return productService
                .update(id, createProductDto.toProduct(restaurant))
                .map(DisplayProductDto::from);
    }

    @Override
    public Optional<DisplayProductDto> deleteById(Long id) {
        return productService
                .deleteById(id)
                .map(DisplayProductDto::from);
    }

    @Transactional
    @Override
    public DisplayOrderDto addToOrder(Long id, String username) {
        Product Product = productService
                .findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        Order order = orderService
                .findOrCreatePending(username);
        return DisplayOrderDto.from(productService.addToOrder(Product, order));
    }
    @Transactional
    @Override
    public DisplayOrderDto removeFromOrder(Long id, String username) {
        Product Product = productService
                .findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        Order order = orderService
                .findOrCreatePending(username);
        return DisplayOrderDto.from(productService.removeFromOrder(Product, order));
    }

}
