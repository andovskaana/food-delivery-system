package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.CourierDto;
import com.example.food_delivery.dto.domain.DisplayCourierDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.OrderDto;
import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.application.CourierApplicationService;
import com.example.food_delivery.service.domain.CourierService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourierApplicationServiceImpl implements CourierApplicationService {

    private final CourierService courierService;
    private final UserRepository userRepository;

    public CourierApplicationServiceImpl(CourierService courierService,
                                         UserRepository userRepository) {
        this.courierService = courierService;
        this.userRepository = userRepository;
    }

    @Override
    public List<DisplayCourierDto> findAll() {
        return courierService.findAll().stream()
                .map(BasicMappers::toDisplayDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DisplayCourierDto> findById(Long id) {
        return courierService.findById(id).map(BasicMappers::toDisplayDto);
    }

    @Override
    public CourierDto save(CourierDto dto) {
        User user = userRepository.findById(dto.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Courier courier = new Courier(user, dto.getActive());
        return BasicMappers.toDto(courierService.save(courier));
    }

    @Override
    public Optional<CourierDto> update(Long id, Courier courier) {
        return courierService.update(id, courier).map(BasicMappers::toDto);
    }

    @Override
    public Optional<CourierDto> deleteById(Long id) {
        return courierService.deleteById(id).map(BasicMappers::toDto);
    }

    @Override
    public DisplayOrderDto assignToOrder(String username, Long orderId) {
        return BasicMappers.toDisplayDto(courierService.assignToOrder(username, orderId));
    }

    @Override
    public DisplayOrderDto completeDelivery(String username, Long orderId) {
        return BasicMappers.toDisplayDto(courierService.completeDelivery(username, orderId));
    }

    @Override
    public List<OrderDto> findDeliveredOrders(String username) {
        return courierService.findDeliveredOrders(username).stream()
                .map(BasicMappers::toOrderDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDto> getOfferedOrders(String username) {
        return courierService.getOfferedOrders(username).stream()
                .map(BasicMappers::toOrderDto)
                .collect(Collectors.toList());
    }

    @Override
    public void rateCourier(String customerUsername, Long orderId, Integer rating) {
        courierService.rateCourier(customerUsername, orderId, rating);
    }
}
