package com.example.food_delivery.service.application;

import com.example.food_delivery.dto.domain.CreateProductDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.DisplayProductDetailsDto;
import com.example.food_delivery.dto.domain.DisplayProductDto;

import java.util.List;
import java.util.Optional;

public interface ProductApplicationService {
    List<DisplayProductDto> findAll();

    Optional<DisplayProductDto> findById(Long id);

    Optional<DisplayProductDetailsDto> findByIdWithDetails(Long id);

    DisplayProductDto save(CreateProductDto createMenuItemDto);

    Optional<DisplayProductDto> update(Long id, CreateProductDto createMenuItemDto);

    Optional<DisplayProductDto> deleteById(Long id);

    DisplayOrderDto addToOrder(Long id, String username);

    DisplayOrderDto removeFromOrder(Long id, String username);
}
