package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.CreateProductDto;
import com.example.food_delivery.dto.domain.DisplayOrderDto;
import com.example.food_delivery.dto.domain.DisplayProductDetailsDto;
import com.example.food_delivery.dto.domain.DisplayProductDto;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.PromotionRequest;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.exceptions.ProductNotFoundException;
import com.example.food_delivery.model.exceptions.RestaurantNotFoundException;
import com.example.food_delivery.repository.PromotionRequestRepository;
import com.example.food_delivery.service.application.ProductApplicationService;
import com.example.food_delivery.service.domain.OrderService;
import com.example.food_delivery.service.domain.ProductService;
import com.example.food_delivery.service.domain.RestaurantService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductApplicationServiceImpl implements ProductApplicationService {

    private final ProductService productService;
    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final PromotionRequestRepository promotionRepository;

    public ProductApplicationServiceImpl(ProductService productService,
                                         RestaurantService restaurantService,
                                         OrderService orderService,
                                         PromotionRequestRepository promotionRepository) {
        this.productService = productService;
        this.restaurantService = restaurantService;
        this.orderService = orderService;
        this.promotionRepository = promotionRepository;
    }

    @Override
    public List<DisplayProductDto> findAll() {
        List<Product> products = productService.findAll();
        List<PromotionRequest> active = promotionRepository.findAllActive(Instant.now());

        Map<Long, List<PromotionRequest>> byProduct = new HashMap<>();
        Map<Long, List<PromotionRequest>> byRestaurant = new HashMap<>();
        for (PromotionRequest promo : active) {
            if (promo.getTargetProduct() != null) {
                byProduct.computeIfAbsent(promo.getTargetProduct().getId(), k -> new ArrayList<>()).add(promo);
            } else if (promo.getRestaurant() != null) {
                byRestaurant.computeIfAbsent(promo.getRestaurant().getId(), k -> new ArrayList<>()).add(promo);
            }
        }

        return products.stream().map(p -> {
            List<PromotionRequest> applicable = new ArrayList<>();
            applicable.addAll(byRestaurant.getOrDefault(p.getRestaurant().getId(), List.of()));
            applicable.addAll(byProduct.getOrDefault(p.getId(), List.of()));
            return applyBestPromotion(p, applicable);
        }).toList();
    }

    @Override
    public Optional<DisplayProductDto> findById(Long id) {
        return productService.findById(id).map(p -> {
            Instant now = Instant.now();
            List<PromotionRequest> applicable = new ArrayList<>();
            applicable.addAll(promotionRepository.findActiveByRestaurant(p.getRestaurant(), now));
            applicable.addAll(promotionRepository.findActiveByProduct(p, now));
            return applyBestPromotion(p, applicable);
        });
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

    /**
     * Picks the single best (lowest-price) applicable promotion and returns a DTO carrying
     * the discounted price, effective discount percent, and promotion name. If no promotion
     * lowers the price, returns the plain product DTO.
     */
    private DisplayProductDto applyBestPromotion(Product product, List<PromotionRequest> promos) {
        double price = product.getPrice() != null ? product.getPrice() : 0.0;
        if (price <= 0 || promos.isEmpty()) return DisplayProductDto.from(product);

        Double bestPrice = null;
        String bestName = null;
        for (PromotionRequest promo : promos) {
            Double discounted = null;
            if (promo.getDiscountPercent() != null && promo.getDiscountPercent() > 0) {
                discounted = price * (1.0 - promo.getDiscountPercent() / 100.0);
            } else if (promo.getDiscountAmount() != null && promo.getDiscountAmount() > 0) {
                discounted = price - promo.getDiscountAmount();
            }
            if (discounted == null) continue;
            if (discounted < 0) discounted = 0.0;
            if (bestPrice == null || discounted < bestPrice) {
                bestPrice = discounted;
                bestName = promo.getPromotionName();
            }
        }

        if (bestPrice == null || bestPrice >= price) return DisplayProductDto.from(product);

        double roundedPrice = Math.round(bestPrice * 100.0) / 100.0;
        double percent = Math.round((1.0 - roundedPrice / price) * 100.0);
        return DisplayProductDto.from(product, percent, roundedPrice, bestName);
    }

}
