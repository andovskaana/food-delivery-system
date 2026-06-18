package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.Product;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.domain.UserOrderHistory;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.repository.RestaurantRepository;
import com.example.food_delivery.repository.UserOrderHistoryRepository;
import com.example.food_delivery.service.domain.RfmAnalysisService;
import com.example.food_delivery.service.domain.RfmPromotionService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RfmPromotionServiceImpl implements RfmPromotionService {

    private final RfmAnalysisService rfmAnalysisService;
    private final UserOrderHistoryRepository userOrderHistoryRepository;
    private final ProductRepository productRepository;
    private final RestaurantRepository restaurantRepository;

    // Segment-specific configurations
    private static final double LOYAL_FREE_DELIVERY_THRESHOLD = 200.0; // MKD
    private static final double DEFAULT_DELIVERY_FEE = 50.0;

    // Segment goals mapping
    private static final Map<String, String> SEGMENT_GOALS = Map.of(
            "Champions", "Retention",
            "Loyal Customers", "Increase monetary value",
            "Potential Loyalists", "Turn into regular users",
            "At Risk", "Reactivation",
            "Lost Customers", "Last attempt at reactivation",
            "Can't Lose Them", "Urgent reactivation",
            "New Customers", "Convert to loyalists",
            "Promising", "Encourage repeat orders",
            "Need Attention", "Re-engage before they leave",
            "About to Sleep", "Wake up before they're lost"
    );

    public RfmPromotionServiceImpl(
            RfmAnalysisService rfmAnalysisService,
            UserOrderHistoryRepository userOrderHistoryRepository,
            ProductRepository productRepository,
            RestaurantRepository restaurantRepository) {
        this.rfmAnalysisService = rfmAnalysisService;
        this.userOrderHistoryRepository = userOrderHistoryRepository;
        this.productRepository = productRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public RfmSegmentOffersDto getSegmentOffers(User user) {
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());

        String segment = rfmData != null ? rfmData.customerSegment() : "New Customers";

        List<RfmPromotionDto> promotions = getPromotionsForSegment(segment);
        List<DisplayProductDto> products = getRecommendedProductsForSegment(user, segment);
        List<DisplayRestaurantDto> restaurants = getRecommendedRestaurantsForSegment(user, segment);
        FreeDeliveryInfoDto freeDeliveryInfo = getFreeDeliveryInfo(user, 0.0);

        return new RfmSegmentOffersDto(
                user.getUsername(),
                segment,
                SEGMENT_GOALS.getOrDefault(segment, "Engagement"),
                promotions,
                products,
                restaurants,
                freeDeliveryInfo
        );
    }

    @Override
    public List<RfmPromotionDto> getPromotionsForUser(User user) {
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());
        String segment = rfmData != null ? rfmData.customerSegment() : "New Customers";
        return getPromotionsForSegment(segment);
    }

    private List<RfmPromotionDto> getPromotionsForSegment(String segment) {
        List<RfmPromotionDto> promotions = new ArrayList<>();
        String expiresAt = LocalDateTime.now().plusDays(7)
                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        switch (segment) {
            case "Champions" -> {
                // VIP treatment
                promotions.add(new RfmPromotionDto(
                        "FREE_DELIVERY",
                        "VIP Free Delivery",
                        "As our champion customer, enjoy free delivery on all orders!",
                        null,
                        null,
                        null,
                        null,
                        "#10B981", // Green
                        "crown"
                ));
                promotions.add(new RfmPromotionDto(
                        "DISCOUNT",
                        "VIP 10% Off",
                        "Exclusive 10% discount on your next order",
                        10,
                        null,
                        "VIP10",
                        expiresAt,
                        "#10B981",
                        "star"
                ));
            }
            case "Loyal Customers" -> {
                // Increase monetary value
                promotions.add(new RfmPromotionDto(
                        "THRESHOLD_DELIVERY",
                        "Free Delivery on 200+ MKD",
                        "Add 200 MKD or more to get free delivery!",
                        null,
                        LOYAL_FREE_DELIVERY_THRESHOLD,
                        null,
                        null,
                        "#3B82F6", // Blue
                        "truck"
                ));
                promotions.add(new RfmPromotionDto(
                        "UPSELL",
                        "Complete Your Meal",
                        "Add a dessert or drink to complete your order",
                        null,
                        null,
                        null,
                        null,
                        "#3B82F6",
                        "plus-circle"
                ));
            }
            case "Potential Loyalists" -> {
                // Second order incentive
                promotions.add(new RfmPromotionDto(
                        "COUPON",
                        "15% Off Your Next Order",
                        "Use code COMEBACK15 for 15% off your next order!",
                        15,
                        null,
                        "COMEBACK15",
                        expiresAt,
                        "#F59E0B", // Amber
                        "gift"
                ));
            }
            case "New Customers" -> {
                // Welcome offer
                promotions.add(new RfmPromotionDto(
                        "COUPON",
                        "Welcome! 20% Off",
                        "Welcome to our family! Enjoy 20% off your second order",
                        20,
                        null,
                        "WELCOME20",
                        expiresAt,
                        "#8B5CF6", // Purple
                        "sparkles"
                ));
            }
            case "At Risk", "Need Attention", "About to Sleep" -> {
                // Reactivation
                promotions.add(new RfmPromotionDto(
                        "DISCOUNT",
                        "We Miss You! 30% Off",
                        "It's been a while! Come back with 30% off today only",
                        30,
                        null,
                        "MISSYOU30",
                        LocalDateTime.now().plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                        "#EF4444", // Red
                        "heart"
                ));
            }
            case "Can't Lose Them" -> {
                // Urgent reactivation for high-value
                promotions.add(new RfmPromotionDto(
                        "DISCOUNT",
                        "Special Offer Just For You!",
                        "We value you! Here's 40% off + free delivery",
                        40,
                        null,
                        "SPECIAL40",
                        LocalDateTime.now().plusDays(3).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                        "#DC2626", // Dark red
                        "fire"
                ));
                promotions.add(new RfmPromotionDto(
                        "FREE_DELIVERY",
                        "Free Delivery Included",
                        "Free delivery on this special offer",
                        null,
                        null,
                        null,
                        null,
                        "#DC2626",
                        "truck"
                ));
            }
            case "Lost Customers", "Hibernating" -> {
                // Last attempt
                promotions.add(new RfmPromotionDto(
                        "DISCOUNT",
                        "Final Offer: 50% Off!",
                        "We really want you back! 50% off - expires in 24 hours!",
                        50,
                        null,
                        "LASTCHANCE50",
                        LocalDateTime.now().plusHours(24).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                        "#1F2937", // Dark gray
                        "clock"
                ));
            }
            default -> {
                // Default promotion
                promotions.add(new RfmPromotionDto(
                        "DISCOUNT",
                        "10% Off Today",
                        "Enjoy 10% off your order today!",
                        10,
                        null,
                        "SAVE10",
                        expiresAt,
                        "#6B7280",
                        "tag"
                ));
            }
        }

        return promotions;
    }

    private List<DisplayProductDto> getRecommendedProductsForSegment(User user, String segment) {
        List<Product> products;

        switch (segment) {
            case "Champions" -> {
                // Favorite products + new matching products
                products = getFavoriteAndNewMatchingProducts(user);
            }
            case "Loyal Customers" -> {
                // Upselling: desserts, drinks, combo items
                products = getUpsellProducts(user);
            }
            case "Potential Loyalists", "Promising" -> {
                // Same cuisine types + popular
                products = getSameCuisineAndPopularProducts(user);
            }
            case "At Risk", "Need Attention", "About to Sleep", "Can't Lose Them" -> {
                // Previously used restaurants' products
                products = getPreviouslyOrderedRestaurantProducts(user);
            }
            case "Lost Customers", "Hibernating" -> {
                // Mass popular offers
                products = getMostPopularProducts();
            }
            default -> {
                // Popular products for new/unknown
                products = getMostPopularProducts();
            }
        }

        return DisplayProductDto.from(products.stream().limit(10).toList());
    }

    private List<DisplayRestaurantDto> getRecommendedRestaurantsForSegment(User user, String segment) {
        List<Restaurant> restaurants;

        switch (segment) {
            case "Champions" -> {
                // Favorite + new matching restaurants
                restaurants = getFavoriteAndNewRestaurants(user);
            }
            case "Loyal Customers", "Potential Loyalists" -> {
                // Mix of favorite and popular
                restaurants = getMixedRestaurants(user);
            }
            case "At Risk", "Need Attention", "Can't Lose Them" -> {
                // Previously used restaurants
                restaurants = getPreviouslyUsedRestaurants(user);
            }
            default -> {
                // Popular restaurants
                restaurants = getPopularRestaurants();
            }
        }

        return DisplayRestaurantDto.from(restaurants.stream().limit(5).toList());
    }

    @Override
    public FreeDeliveryInfoDto getFreeDeliveryInfo(User user, Double cartTotal) {
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());
        String segment = rfmData != null ? rfmData.customerSegment() : "New Customers";

        // Champions and Can't Lose Them get free delivery
        if ("Champions".equals(segment) || "Can't Lose Them".equals(segment)) {
            return new FreeDeliveryInfoDto(
                    true,
                    true,
                    cartTotal,
                    null,
                    0.0,
                    "You have VIP free delivery!"
            );
        }

        // Loyal customers get threshold-based free delivery
        if ("Loyal Customers".equals(segment)) {
            boolean isFree = cartTotal >= LOYAL_FREE_DELIVERY_THRESHOLD;
            double remaining = isFree ? 0 : LOYAL_FREE_DELIVERY_THRESHOLD - cartTotal;

            String message = isFree
                    ? "You qualify for free delivery!"
                    : String.format("Add %.0f MKD more for free delivery!", remaining);

            return new FreeDeliveryInfoDto(
                    true,
                    isFree,
                    cartTotal,
                    LOYAL_FREE_DELIVERY_THRESHOLD,
                    remaining,
                    message
            );
        }

        // Others pay standard delivery
        return new FreeDeliveryInfoDto(
                false,
                false,
                cartTotal,
                null,
                null,
                "Standard delivery fee applies"
        );
    }

    @Override
    public boolean qualifiesForFreeDelivery(User user) {
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());
        String segment = rfmData != null ? rfmData.customerSegment() : "";

        return "Champions".equals(segment) || "Can't Lose Them".equals(segment);
    }

    @Override
    public int getDiscountForUser(User user) {
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());
        String segment = rfmData != null ? rfmData.customerSegment() : "";

        return switch (segment) {
            case "Champions" -> 10;
            case "Loyal Customers" -> 5;
            case "Potential Loyalists", "New Customers" -> 15;
            case "At Risk", "Need Attention", "About to Sleep" -> 30;
            case "Can't Lose Them" -> 40;
            case "Lost Customers", "Hibernating" -> 50;
            default -> 0;
        };
    }

    // Helper methods for product recommendations

    private List<Product> getFavoriteAndNewMatchingProducts(User user) {
        List<Product> result = new ArrayList<>();

        // Get user's order history
        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (!history.isEmpty()) {
            // Get frequently ordered products
            Map<Long, Long> productCounts = history.stream()
                    .collect(Collectors.groupingBy(
                            h -> h.getProduct().getId(),
                            Collectors.counting()
                    ));

            // Get top products by order count
            List<Long> topProductIds = productCounts.entrySet().stream()
                    .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                    .limit(5)
                    .map(Map.Entry::getKey)
                    .toList();

            result.addAll(productRepository.findAllById(topProductIds));

            // Get categories user likes
            Set<String> preferredCategories = history.stream()
                    .map(h -> h.getProduct().getCategory())
                    .collect(Collectors.toSet());

            // Add new products from preferred categories
            List<Product> allProducts = productRepository.findAll();
            List<Product> newMatching = allProducts.stream()
                    .filter(p -> preferredCategories.contains(p.getCategory()))
                    .filter(p -> !topProductIds.contains(p.getId()))
                    .limit(5)
                    .toList();

            result.addAll(newMatching);
        }

        return result;
    }

    private List<Product> getUpsellProducts(User user) {
        // Get desserts, drinks, and sides for upselling
        List<Product> allProducts = productRepository.findAll();

        Set<String> upsellCategories = Set.of("DESSERT", "BEVERAGE", "DRINK", "SIDE", "DESSERTS", "BEVERAGES", "DRINKS", "SIDES");

        return allProducts.stream()
                .filter(p -> upsellCategories.stream()
                        .anyMatch(cat -> p.getCategory() != null &&
                                p.getCategory().toUpperCase().contains(cat)))
                .limit(10)
                .toList();
    }

    private List<Product> getSameCuisineAndPopularProducts(User user) {
        List<Product> result = new ArrayList<>();

        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (!history.isEmpty()) {
            // Get restaurant categories user ordered from
            Set<String> cuisineTypes = history.stream()
                    .map(h -> h.getRestaurant().getCategory())
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // Get products from same cuisine types
            List<Product> allProducts = productRepository.findAll();
            List<Product> sameCuisine = allProducts.stream()
                    .filter(p -> p.getRestaurant() != null &&
                            cuisineTypes.contains(p.getRestaurant().getCategory()))
                    .limit(5)
                    .toList();

            result.addAll(sameCuisine);
        }

        // Add popular products
        result.addAll(getMostPopularProducts().stream().limit(5).toList());

        return result;
    }

    private List<Product> getPreviouslyOrderedRestaurantProducts(User user) {
        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (history.isEmpty()) {
            return getMostPopularProducts();
        }

        // Get restaurants user previously ordered from
        Set<Long> restaurantIds = history.stream()
                .map(h -> h.getRestaurant().getId())
                .collect(Collectors.toSet());

        // Get products from those restaurants
        List<Product> allProducts = productRepository.findAll();

        return allProducts.stream()
                .filter(p -> p.getRestaurant() != null &&
                        restaurantIds.contains(p.getRestaurant().getId()))
                .limit(10)
                .toList();
    }

    private List<Product> getMostPopularProducts() {
        // For simplicity, return first 10 available products
        // In production, this would query order history for most ordered
        return productRepository.findAll().stream()
                .filter(Product::getIsAvailable)
                .limit(10)
                .toList();
    }

    // Helper methods for restaurant recommendations

    private List<Restaurant> getFavoriteAndNewRestaurants(User user) {
        List<Restaurant> result = new ArrayList<>();

        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (!history.isEmpty()) {
            // Get favorite restaurants
            Map<Long, Long> restaurantCounts = history.stream()
                    .collect(Collectors.groupingBy(
                            h -> h.getRestaurant().getId(),
                            Collectors.counting()
                    ));

            List<Long> topRestaurantIds = restaurantCounts.entrySet().stream()
                    .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .toList();

            result.addAll(restaurantRepository.findAllById(topRestaurantIds));

            // Get new restaurants with matching categories
            Set<String> preferredCategories = result.stream()
                    .map(Restaurant::getCategory)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<Restaurant> newMatching = restaurantRepository.findAll().stream()
                    .filter(r -> preferredCategories.contains(r.getCategory()))
                    .filter(r -> !topRestaurantIds.contains(r.getId()))
                    .limit(2)
                    .toList();

            result.addAll(newMatching);
        }

        return result;
    }

    private List<Restaurant> getMixedRestaurants(User user) {
        List<Restaurant> result = new ArrayList<>();

        // Add some previously used
        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (!history.isEmpty()) {
            Set<Long> restaurantIds = history.stream()
                    .map(h -> h.getRestaurant().getId())
                    .limit(2)
                    .collect(Collectors.toSet());

            result.addAll(restaurantRepository.findAllById(restaurantIds));
        }

        // Add popular restaurants
        result.addAll(getPopularRestaurants().stream().limit(3).toList());

        return result;
    }

    private List<Restaurant> getPreviouslyUsedRestaurants(User user) {
        List<UserOrderHistory> history = userOrderHistoryRepository.findByUserOrderByOrderDateDesc(user);

        if (history.isEmpty()) {
            return getPopularRestaurants();
        }

        Set<Long> restaurantIds = history.stream()
                .map(h -> h.getRestaurant().getId())
                .collect(Collectors.toSet());

        return restaurantRepository.findAllById(new ArrayList<>(restaurantIds));
    }

    private List<Restaurant> getPopularRestaurants() {
        // Return restaurants sorted by rating
        return restaurantRepository.findAll().stream()
                .filter(Restaurant::getIsOpen)
                .sorted((a, b) -> Double.compare(
                        b.getAverageRating() != null ? b.getAverageRating() : 0,
                        a.getAverageRating() != null ? a.getAverageRating() : 0
                ))
                .limit(5)
                .toList();
    }

    @Override
    public ApplyCouponResponseDto validateCoupon(User user, String couponCode, Double subtotal) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return new ApplyCouponResponseDto(false, "Please enter a coupon code", null, null, null, null, null);
        }

        String code = couponCode.trim().toUpperCase();

        // Get user's segment to determine valid coupons
        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());
        String segment = rfmData != null ? rfmData.customerSegment() : "New Customers";

        // Get valid coupons for user's segment
        List<RfmPromotionDto> promotions = getPromotionsForSegment(segment);

        // Find matching coupon
        Optional<RfmPromotionDto> matchingPromo = promotions.stream()
                .filter(p -> code.equals(p.couponCode()))
                .findFirst();

        if (matchingPromo.isEmpty()) {
            // Check if it's a valid code but not for this user's segment
            boolean isValidCodeButWrongSegment = isValidCouponCode(code);
            if (isValidCodeButWrongSegment) {
                return new ApplyCouponResponseDto(false, "This coupon is not available for your account", null, null, null, null, null);
            }
            return new ApplyCouponResponseDto(false, "Invalid coupon code", null, null, null, null, null);
        }

        RfmPromotionDto promo = matchingPromo.get();

        // Check if expired
        if (promo.expiresAt() != null) {
            try {
                LocalDateTime expiry = LocalDateTime.parse(promo.expiresAt(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                if (LocalDateTime.now().isAfter(expiry)) {
                    return new ApplyCouponResponseDto(false, "This coupon has expired", null, null, null, null, null);
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
        }

        // Calculate discount
        Integer discountPercent = promo.discountPercent();
        if (discountPercent == null || discountPercent <= 0) {
            return new ApplyCouponResponseDto(false, "Invalid coupon configuration", null, null, null, null, null);
        }

        double discountAmount = Math.round(subtotal * discountPercent / 100.0 * 100.0) / 100.0;
        double newTotal = subtotal - discountAmount;

        // Check if user also qualifies for free delivery
        boolean freeDelivery = qualifiesForFreeDelivery(user);

        return new ApplyCouponResponseDto(
                true,
                String.format("%d%% discount applied!", discountPercent),
                code,
                discountPercent,
                discountAmount,
                newTotal,
                freeDelivery
        );
    }

    private boolean isValidCouponCode(String code) {
        // List of all valid coupon codes in the system
        Set<String> allValidCodes = Set.of(
                "VIP10", "COMEBACK15", "WELCOME20", "MISSYOU30",
                "SPECIAL40", "LASTCHANCE50", "SAVE10"
        );
        return allValidCodes.contains(code);
    }
}
