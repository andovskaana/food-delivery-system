package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.owner.*;
import com.example.food_delivery.model.domain.*;
import com.example.food_delivery.model.enums.OrderStatus;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.repository.ProductRepository;
import com.example.food_delivery.repository.PromotionRequestRepository;
import com.example.food_delivery.repository.RestaurantRepository;
import com.example.food_delivery.service.domain.RestaurantOwnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class RestaurantOwnerController {

    private final RestaurantOwnerService ownerService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final RestaurantRepository restaurantRepository;
    private final PromotionRequestRepository promotionRepository;

    public RestaurantOwnerController(RestaurantOwnerService ownerService,
                                     OrderRepository orderRepository,
                                     ProductRepository productRepository,
                                     RestaurantRepository restaurantRepository,
                                     PromotionRequestRepository promotionRepository) {
        this.ownerService = ownerService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.restaurantRepository = restaurantRepository;
        this.promotionRepository = promotionRepository;
    }

    @GetMapping("/my-restaurants")
    public ResponseEntity<List<Map<String, Object>>> getMyRestaurants(@AuthenticationPrincipal User user) {
        List<Restaurant> restaurants = ownerService.getOwnedRestaurants(user.getUsername());
        List<Map<String, Object>> result = restaurants.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("name", r.getName());
            m.put("description", r.getDescription());
            m.put("category", r.getCategory());
            m.put("openHours", r.getOpenHours());
            m.put("imageUrl", r.getImageUrl());
            m.put("isOpen", r.getIsOpen());
            m.put("zone", r.getZone());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Get all products for a restaurant — for the owner's menu view/edit */
    @GetMapping("/restaurants/{restaurantId}/products")
    public ResponseEntity<List<Map<String, Object>>> getRestaurantProducts(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal User user) {
        if (!ownerService.ownsRestaurant(user.getUsername(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        List<Map<String, Object>> products = productRepository.findByRestaurant(restaurant).stream()
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("name", p.getName());
                    m.put("description", p.getDescription());
                    m.put("price", p.getPrice());
                    m.put("category", p.getCategory());
                    m.put("imageUrl", p.getImageUrl());
                    m.put("quantity", p.getQuantity());
                    m.put("isAvailable", p.getIsAvailable());
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    /** Direct product edit — no admin approval needed, owner edits their own menu */
    @PutMapping("/restaurants/{restaurantId}/products/{productId}")
    public ResponseEntity<Map<String, Object>> editProduct(
            @PathVariable Long restaurantId,
            @PathVariable Long productId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        if (!ownerService.ownsRestaurant(user.getUsername(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (payload.containsKey("name"))        product.setName((String) payload.get("name"));
        if (payload.containsKey("description")) product.setDescription((String) payload.get("description"));
        if (payload.containsKey("price"))       product.setPrice(Double.parseDouble(payload.get("price").toString()));
        if (payload.containsKey("category"))    product.setCategory((String) payload.get("category"));
        if (payload.containsKey("imageUrl"))    product.setImageUrl((String) payload.get("imageUrl"));
        if (payload.containsKey("quantity"))    product.setQuantity(Integer.parseInt(payload.get("quantity").toString()));
        if (payload.containsKey("isAvailable")) product.setIsAvailable((Boolean) payload.get("isAvailable"));

        productRepository.save(product);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", product.getId());
        result.put("name", product.getName());
        result.put("price", product.getPrice());
        result.put("category", product.getCategory());
        result.put("imageUrl", product.getImageUrl());
        result.put("quantity", product.getQuantity());
        result.put("isAvailable", product.getIsAvailable());
        return ResponseEntity.ok(result);
    }

    /** Delete a product directly — no approval needed */
    @DeleteMapping("/restaurants/{restaurantId}/products/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long restaurantId,
            @PathVariable Long productId,
            @AuthenticationPrincipal User user) {
        if (!ownerService.ownsRestaurant(user.getUsername(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }
        productRepository.deleteById(productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restaurants/{restaurantId}/change-request")
    public ResponseEntity<ChangeRequestDto> submitRestaurantChangeRequest(
            @PathVariable Long restaurantId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            OwnerChangeRequest req = ownerService.submitChangeRequest(
                    user.getUsername(), restaurantId, "RESTAURANT_UPDATE", json);
            return ResponseEntity.ok(ChangeRequestDto.from(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/restaurants/{restaurantId}/products/add-request")
    public ResponseEntity<ChangeRequestDto> submitProductAddRequest(
            @PathVariable Long restaurantId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            OwnerChangeRequest req = ownerService.submitChangeRequest(
                    user.getUsername(), restaurantId, "PRODUCT_ADD", json);
            return ResponseEntity.ok(ChangeRequestDto.from(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/restaurants/{restaurantId}/products/{productId}/edit-request")
    public ResponseEntity<ChangeRequestDto> submitProductEditRequest(
            @PathVariable Long restaurantId,
            @PathVariable Long productId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            OwnerChangeRequest req = ownerService.submitChangeRequest(
                    user.getUsername(), restaurantId, "PRODUCT_UPDATE", json);
            req.setTargetProductId(productId);
            return ResponseEntity.ok(ChangeRequestDto.from(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/restaurants/{restaurantId}/products/{productId}/delete-request")
    public ResponseEntity<ChangeRequestDto> submitProductDeleteRequest(
            @PathVariable Long restaurantId,
            @PathVariable Long productId,
            @AuthenticationPrincipal User user) {
        try {
            String json = "{\"productId\":" + productId + "}";
            OwnerChangeRequest req = ownerService.submitChangeRequest(
                    user.getUsername(), restaurantId, "PRODUCT_DELETE", json);
            req.setTargetProductId(productId);
            return ResponseEntity.ok(ChangeRequestDto.from(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-change-requests")
    public ResponseEntity<List<ChangeRequestDto>> getMyChangeRequests(@AuthenticationPrincipal User user) {
        List<ChangeRequestDto> result = ownerService.getPendingChangeRequests().stream()
                .filter(r -> r.getRequester().getUsername().equals(user.getUsername()))
                .map(ChangeRequestDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/restaurants/{restaurantId}/promotions")
    public ResponseEntity<PromotionRequestDto> submitPromotion(
            @PathVariable Long restaurantId,
            @RequestBody PromotionRequest request,
            @AuthenticationPrincipal User user) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        request.setRestaurant(restaurant);
        PromotionRequest saved = ownerService.submitPromotion(user.getUsername(), request);
        return ResponseEntity.ok(PromotionRequestDto.from(saved));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<AnonymizedOrderDto>> getMyOrders(@AuthenticationPrincipal User user) {
        List<Restaurant> owned = ownerService.getOwnedRestaurants(user.getUsername());
        List<AnonymizedOrderDto> orders = owned.stream()
                .flatMap(r -> orderRepository.findByRestaurantId(r.getId()).stream())
                .map(AnonymizedOrderDto::from)
                .sorted(Comparator.comparing(a -> a.placedAt() == null ? Instant.MIN : a.placedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/restaurants/{restaurantId}/import-menu")
    public ResponseEntity<Map<String, Object>> importMenuCsv(
            @PathVariable Long restaurantId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (!ownerService.ownsRestaurant(user.getUsername(), restaurantId)) {
            return ResponseEntity.status(403).body(Map.of("error", "You do not own this restaurant"));
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        List<String> errors = new ArrayList<>();
        List<String> imported = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));

            String[] headers = headerLine.split(",", -1);
            Map<String, Integer> col = new HashMap<>();
            for (int i = 0; i < headers.length; i++) col.put(headers[i].trim().toLowerCase(), i);

            if (!col.containsKey("name") || !col.containsKey("price")) {
                return ResponseEntity.badRequest().body(Map.of("error", "CSV must have at least 'name' and 'price' columns"));
            }

            String line;
            int rowNum = 1;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.isBlank()) continue;
                String[] values = line.split(",", -1);
                try {
                    String name = get(values, col, "name", "").trim();
                    if (name.isEmpty()) { errors.add("Row " + rowNum + ": name is empty, skipped"); continue; }

                    double price = Double.parseDouble(get(values, col, "price", "0").trim());
                    String description = get(values, col, "description", "");
                    String category    = get(values, col, "category", "");
                    String imageUrl    = get(values, col, "imageurl", "");
                    String qtyStr      = get(values, col, "quantity", "100").trim();
                    int quantity = qtyStr.isEmpty() ? 100 : Integer.parseInt(qtyStr);

                    Product product = new Product(name, description, price, quantity, restaurant, category, imageUrl);
                    product.setIsAvailable(true);
                    productRepository.save(product);
                    imported.add(name);
                } catch (NumberFormatException e) {
                    errors.add("Row " + rowNum + ": invalid number — " + e.getMessage());
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to read file: " + e.getMessage()));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("imported", imported.size());
        result.put("errors", errors.size());
        result.put("importedProducts", imported);
        if (!errors.isEmpty()) result.put("errorDetails", errors);
        return ResponseEntity.ok(result);
    }

    private String get(String[] values, Map<String, Integer> col, String name, String def) {
        Integer idx = col.get(name);
        if (idx == null || idx >= values.length) return def;
        String v = values[idx].trim();
        if (v.startsWith("\"") && v.endsWith("\"")) v = v.substring(1, v.length() - 1).trim();
        return v.isEmpty() ? def : v;
    }

    @GetMapping("/analytics/{restaurantId}")
    public ResponseEntity<OwnerAnalyticsDto> getAnalytics(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal User user) {

        if (!ownerService.ownsRestaurant(user.getUsername(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        List<Order> orders = orderRepository.findByRestaurantId(restaurantId);

        long total = orders.size();
        double revenue = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0)
                .sum();
        long deliveredCount = orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count();
        double avgOrderValue = deliveredCount > 0 ? revenue / deliveredCount : 0.0;
        long cancelled = orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELED).count();

        Map<Long, long[]> productStats = new HashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        Map<Long, double[]> productRevenue = new HashMap<>();
        for (Order o : orders) {
            for (OrderItem item : o.getItems()) {
                Long pid = item.getProduct().getId();
                productStats.computeIfAbsent(pid, k -> new long[]{0})[0] += item.getQuantity();
                productNames.put(pid, item.getProduct().getName());
                productRevenue.computeIfAbsent(pid, k -> new double[]{0.0})[0] +=
                        item.getQuantity() * item.getUnitPriceSnapshot();
            }
        }

        List<OwnerAnalyticsDto.ProductSales> sortedProducts = productStats.entrySet().stream()
                .map(e -> new OwnerAnalyticsDto.ProductSales(e.getKey(), productNames.get(e.getKey()),
                        e.getValue()[0], productRevenue.getOrDefault(e.getKey(), new double[]{0.0})[0]))
                .sorted(Comparator.comparingLong(OwnerAnalyticsDto.ProductSales::quantity).reversed())
                .collect(Collectors.toList());

        List<OwnerAnalyticsDto.ProductSales> top = sortedProducts.stream().limit(5).collect(Collectors.toList());
        List<OwnerAnalyticsDto.ProductSales> bottom = sortedProducts.isEmpty() ? List.of() :
                sortedProducts.subList(Math.max(0, sortedProducts.size() - 5), sortedProducts.size());

        Map<String, Long> byDay = new LinkedHashMap<>();
        for (String d : new String[]{"MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"}) byDay.put(d, 0L);
        orders.stream().filter(o -> o.getPlacedAt() != null).forEach(o -> {
            String day = ZonedDateTime.ofInstant(o.getPlacedAt(), java.time.ZoneId.systemDefault()).getDayOfWeek().name();
            byDay.merge(day, 1L, Long::sum);
        });

        Map<Integer, Long> byHour = new LinkedHashMap<>();
        orders.stream().filter(o -> o.getPlacedAt() != null).forEach(o -> {
            int hour = ZonedDateTime.ofInstant(o.getPlacedAt(), java.time.ZoneId.systemDefault()).getHour();
            byHour.merge(hour, 1L, Long::sum);
        });

        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Double> revenueByMonth = new TreeMap<>();
        orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED && o.getPlacedAt() != null).forEach(o -> {
            String month = ZonedDateTime.ofInstant(o.getPlacedAt(), java.time.ZoneId.systemDefault()).format(monthFmt);
            revenueByMonth.merge(month, o.getTotal() != null ? o.getTotal() : 0.0, Double::sum);
        });

        return ResponseEntity.ok(new OwnerAnalyticsDto(restaurantId, restaurant.getName(), total,
                revenue, avgOrderValue, cancelled, top, bottom, byDay, byHour, revenueByMonth));
    }
}
