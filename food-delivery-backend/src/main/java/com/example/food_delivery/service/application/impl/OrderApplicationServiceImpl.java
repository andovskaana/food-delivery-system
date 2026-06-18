package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.AddressDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.OrderDto;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.service.application.OrderApplicationService;
import com.example.food_delivery.service.domain.CourierAssignmentService;
import com.example.food_delivery.service.domain.OrderService;
import com.example.food_delivery.service.domain.OrderTotalsService;
import com.example.food_delivery.service.domain.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class OrderApplicationServiceImpl implements OrderApplicationService {

    private final OrderService orderDomain;
    private final ProductService ProductDomain;
    private final OrderTotalsService totalsDomain;
    private final ProductRepository productRepository;
    private final CourierAssignmentService assignmentService;

    public OrderApplicationServiceImpl(OrderService orderDomain,
                                        ProductService productDomain,
                                        OrderTotalsService totalsDomain,
                                        ProductRepository productRepository,
                                        CourierAssignmentService assignmentService) {
        this.orderDomain = orderDomain;
        ProductDomain = productDomain;
        this.totalsDomain = totalsDomain;
        this.productRepository = productRepository;
        this.assignmentService = assignmentService;
    }

    @Override
    public List<OrderDto> findAll() {
        return orderDomain.findAll().stream().map(BasicMappers::toDto).toList();
    }

    @Override
    public List<OrderDto> findAllConfirmed() {
        return orderDomain.findConfirmed().stream().map(BasicMappers::toDto).toList();
    }

    @Override
    public Optional<OrderDto> findById(Long id) {
        return orderDomain.findById(id).map(BasicMappers::toDto);
    }

    @Override
    @Transactional
    public OrderDto getCart(String username) {
        Order cart = orderDomain.findOrCreatePending(username);
        totalsDomain.setFeesAndRecalculate(cart, cart.getRestaurant());
        return BasicMappers.toDto(cart);
    }

    @Override
    @Transactional
    public OrderDto addProductToCart(String username, Long ProductId) {
        Order cart = orderDomain.findOrCreatePending(username);
        Product product = productRepository.findById(ProductId).orElseThrow();
        Order updated = ProductDomain.addToOrder(product, cart);
        return BasicMappers.toDto(updated);
    }

    @Override
    @Transactional
    public OrderDto removeProductFromCart(String username, Long ProductId) {
        Order cart = orderDomain.findOrCreatePending(username);
        Product product = productRepository.findById(ProductId).orElseThrow();
        Order updated = ProductDomain.removeFromOrder(product, cart);
        return BasicMappers.toDto(updated);
    }

    @Override
    @Transactional
    public Optional<OrderDto> confirm(String username) {
        Order updated = orderDomain.confirm(username).orElseThrow();
        // *** Trigger courier assignment algorithm immediately on confirm ***
        assignmentService.offerOrderToCouriers(updated);
        return Optional.of(BasicMappers.toDto(updated));
    }

    @Override
    @Transactional
    public Optional<OrderDto> cancel(String username) {
        Order updated = orderDomain.cancel(username).orElseThrow();
        return Optional.of(BasicMappers.toDto(updated));
    }

    @Override
    public List<OrderDto> findOrdersForCourier(String username) {
        return orderDomain.findOrdersForCourier(username).stream().map(BasicMappers::toDto).toList();
    }

    @Override
    public List<OrderDto> findConfirmedOrdersForCustomer(String username) {
        return orderDomain.findConfirmedOrdersForCustomer(username).stream().map(BasicMappers::toDto).toList();
    }

    @Override
    public OrderDto setDeliveryAddress(Long id, AddressDto address) {
        Order cart = orderDomain.findById(id).orElseThrow();
        cart = orderDomain.updateAddress(id, BasicMappers.fromDto(address)).orElseThrow();
        return BasicMappers.toDto(cart);
    }

    @Override
    @Transactional
    public OrderDto applyDiscount(String username, Double discountAmount) {
        Order cart = orderDomain.findOrCreatePending(username);
        cart.setDiscount(discountAmount == null ? 0.0 : Math.max(0.0, discountAmount));
        totalsDomain.setFeesAndRecalculate(cart, cart.getRestaurant());
        return BasicMappers.toDto(cart);
    }

    @Override
    public DisplayOrderDto findOrCreatePending(String username) {
        return DisplayOrderDto.from(orderDomain.findOrCreatePending(username));
    }
}
