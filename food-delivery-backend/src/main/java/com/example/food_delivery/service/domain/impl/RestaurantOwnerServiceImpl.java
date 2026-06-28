package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.*;
import com.example.food_delivery.model.enums.ChangeRequestStatus;
import com.example.food_delivery.model.enums.ChangeRequestType;
import com.example.food_delivery.repository.*;
import com.example.food_delivery.service.domain.RestaurantOwnerService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RestaurantOwnerServiceImpl implements RestaurantOwnerService {

    private final RestaurantOwnerRepository ownerRepository;
    private final OwnerChangeRequestRepository changeRequestRepository;
    private final PromotionRequestRepository promotionRepository;
    private final RestaurantRepository restaurantRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public RestaurantOwnerServiceImpl(RestaurantOwnerRepository ownerRepository,
                                       OwnerChangeRequestRepository changeRequestRepository,
                                       PromotionRequestRepository promotionRepository,
                                       RestaurantRepository restaurantRepository,
                                       ProductRepository productRepository,
                                       UserRepository userRepository) {
        this.ownerRepository = ownerRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.promotionRepository = promotionRepository;
        this.restaurantRepository = restaurantRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<Restaurant> getOwnedRestaurants(String username) {
        return ownerRepository.findByUser_Username(username)
                .map(RestaurantOwner::getRestaurants)
                .orElse(new ArrayList<>());
    }

    @Override
    @Transactional
    public OwnerChangeRequest submitChangeRequest(String username, Long restaurantId,
                                                   String type, String payload) {
        return submitChangeRequest(username, restaurantId, type, payload, null);
    }

    @Override
    @Transactional
    public OwnerChangeRequest submitChangeRequest(String username, Long restaurantId,
                                                   String type, String payload, Long targetProductId) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!ownsRestaurant(username, restaurantId)) {
            throw new RuntimeException("You do not own this restaurant");
        }

        ChangeRequestType requestType = ChangeRequestType.valueOf(type);
        OwnerChangeRequest request = new OwnerChangeRequest(user, restaurant, requestType, payload);
        // Set the target product id inside the transaction so it is persisted with the request.
        request.setTargetProductId(targetProductId);
        return changeRequestRepository.save(request);
    }

    @Override
    public List<OwnerChangeRequest> getChangeRequestsByOwner(String username) {
        return changeRequestRepository.findByRequesterUsername(username);
    }

    @Override
    public List<PromotionRequest> getPromotionsByOwner(String username) {
        return promotionRepository.findByRequesterUsername(username);
    }

    @Override
    @Transactional
    public PromotionRequest submitPromotion(String username, PromotionRequest request) {
        if (request.getRestaurant() == null || request.getRestaurant().getId() == null) {
            throw new RuntimeException("Restaurant is required for a promotion");
        }
        if (!ownsRestaurant(username, request.getRestaurant().getId())) {
            throw new RuntimeException("You do not own this restaurant");
        }
        validatePromotionRequest(request);

        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        request.setRequester(user);
        request.setStatus(ChangeRequestStatus.PENDING);
        request.setActive(false);
        request.setRejectionReason(null);
        request.setReviewedAt(null);
        request.setReviewedBy(null);
        request.setCreatedAt(Instant.now());
        return promotionRepository.save(request);
    }


    private void validatePromotionRequest(PromotionRequest request) {
        boolean hasPercent = request.getDiscountPercent() != null && request.getDiscountPercent() > 0;
        boolean hasAmount = request.getDiscountAmount() != null && request.getDiscountAmount() > 0;

        if (!hasPercent && !hasAmount) {
            throw new RuntimeException("Promotion must have either a percentage or fixed discount");
        }
        if (hasPercent && request.getDiscountPercent() > 100) {
            throw new RuntimeException("Discount percentage cannot be greater than 100");
        }
        if (request.getValidFrom() != null && request.getValidUntil() != null
                && !request.getValidUntil().isAfter(request.getValidFrom())) {
            throw new RuntimeException("Promotion end date must be after start date");
        }
    }

    @Override
    public List<OwnerChangeRequest> getPendingChangeRequests() {
        return changeRequestRepository.findByStatus(ChangeRequestStatus.PENDING);
    }

    @Override
    @Transactional
    public OwnerChangeRequest approveChangeRequest(Long requestId, String adminUsername) {
        OwnerChangeRequest req = changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Change request not found"));
        User admin = userRepository.findById(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Apply the changes
        applyChangeRequest(req);

        req.setStatus(ChangeRequestStatus.APPROVED);
        req.setReviewedAt(Instant.now());
        req.setReviewedBy(admin);
        return changeRequestRepository.save(req);
    }

    @Override
    @Transactional
    public OwnerChangeRequest rejectChangeRequest(Long requestId, String adminUsername, String reason) {
        OwnerChangeRequest req = changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Change request not found"));
        User admin = userRepository.findById(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        req.setStatus(ChangeRequestStatus.REJECTED);
        req.setRejectionReason(reason);
        req.setReviewedAt(Instant.now());
        req.setReviewedBy(admin);
        return changeRequestRepository.save(req);
    }

    @Override
    public List<PromotionRequest> getPendingPromotions() {
        return promotionRepository.findByStatus(ChangeRequestStatus.PENDING);
    }

    @Override
    @Transactional
    public PromotionRequest approvePromotion(Long promotionId, String adminUsername) {
        PromotionRequest promo = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));
        User admin = userRepository.findById(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        promo.setStatus(ChangeRequestStatus.APPROVED);
        promo.setActive(true);
        promo.setReviewedAt(Instant.now());
        promo.setReviewedBy(admin);
        return promotionRepository.save(promo);
    }

    @Override
    @Transactional
    public PromotionRequest rejectPromotion(Long promotionId, String adminUsername, String reason) {
        PromotionRequest promo = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));
        User admin = userRepository.findById(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        promo.setStatus(ChangeRequestStatus.REJECTED);
        promo.setRejectionReason(reason);
        promo.setReviewedAt(Instant.now());
        promo.setReviewedBy(admin);
        return promotionRepository.save(promo);
    }

    @Override
    public boolean ownsRestaurant(String username, Long restaurantId) {
        return ownerRepository.findByUser_Username(username)
                .map(owner -> owner.getRestaurants().stream()
                        .anyMatch(r -> r.getId().equals(restaurantId)))
                .orElse(false);
    }

    // ---- Private helpers ----

    private void applyChangeRequest(OwnerChangeRequest req) {
        try {
            Map<String, Object> payload = objectMapper.readValue(req.getPayload(),
                    new TypeReference<Map<String, Object>>() {});

            switch (req.getType()) {
                case RESTAURANT_UPDATE -> applyRestaurantUpdate(req.getRestaurant(), payload);
                case PRODUCT_ADD -> applyProductAdd(req.getRestaurant(), payload);
                case PRODUCT_UPDATE -> applyProductUpdate(req.getTargetProductId(), payload);
                case PRODUCT_DELETE -> applyProductDelete(req.getTargetProductId());
                default -> throw new RuntimeException("Unknown change request type: " + req.getType());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to apply change request: " + e.getMessage(), e);
        }
    }

    private void applyRestaurantUpdate(Restaurant restaurant, Map<String, Object> payload) {
        if (payload.containsKey("name"))
            restaurant.setName((String) payload.get("name"));
        if (payload.containsKey("description"))
            restaurant.setDescription((String) payload.get("description"));
        if (payload.containsKey("category"))
            restaurant.setCategory((String) payload.get("category"));
        if (payload.containsKey("openHours"))
            restaurant.setOpenHours((String) payload.get("openHours"));
        if (payload.containsKey("imageUrl"))
            restaurant.setImageUrl((String) payload.get("imageUrl"));
        if (payload.containsKey("isOpen") && payload.get("isOpen") instanceof Boolean)
            restaurant.setIsOpen((Boolean) payload.get("isOpen"));
        restaurantRepository.save(restaurant);
    }

    private void applyProductAdd(Restaurant restaurant, Map<String, Object> payload) {
        Product product = new Product();
        product.setRestaurant(restaurant);
        product.setName((String) payload.getOrDefault("name", "New Product"));
        product.setDescription((String) payload.getOrDefault("description", ""));
        if (payload.containsKey("price") && payload.get("price") instanceof Number)
            product.setPrice(((Number) payload.get("price")).doubleValue());
        int quantity = 100;
        if (payload.get("quantity") instanceof Number)
            quantity = ((Number) payload.get("quantity")).intValue();
        product.setQuantity(quantity);
        product.setCategory((String) payload.getOrDefault("category", "Other"));
        product.setImageUrl((String) payload.getOrDefault("imageUrl", ""));
        product.setIsAvailable(true);
        productRepository.save(product);
    }

    private void applyProductUpdate(Long productId, Map<String, Object> payload) {
        if (productId == null) return;
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (payload.containsKey("name")) product.setName((String) payload.get("name"));
        if (payload.containsKey("description")) product.setDescription((String) payload.get("description"));
        if (payload.containsKey("price"))
            product.setPrice(((Number) payload.get("price")).doubleValue());
        if (payload.containsKey("category")) product.setCategory((String) payload.get("category"));
        if (payload.containsKey("imageUrl")) product.setImageUrl((String) payload.get("imageUrl"));
        if (payload.containsKey("quantity") && payload.get("quantity") instanceof Number)
            product.setQuantity(((Number) payload.get("quantity")).intValue());
        if (payload.containsKey("isAvailable") && payload.get("isAvailable") instanceof Boolean)
            product.setIsAvailable((Boolean) payload.get("isAvailable"));
        productRepository.save(product);
    }

    private void applyProductDelete(Long productId) {
        if (productId == null) return;
        productRepository.deleteById(productId);
    }
}
