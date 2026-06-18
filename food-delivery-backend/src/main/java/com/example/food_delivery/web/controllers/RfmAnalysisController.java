package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.domain.RfmAnalysisService;
import com.example.food_delivery.service.domain.RfmPromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "rfm-analysis-controller", description = "RFM (Recency, Frequency, Monetary) Customer Segmentation Analysis")
@RestController
@RequestMapping("/api/rfm")
@RequiredArgsConstructor
public class RfmAnalysisController {

    private final RfmAnalysisService rfmAnalysisService;
    private final RfmPromotionService rfmPromotionService;

    /**
     * Run RFM analysis on all customers.
     * This endpoint triggers a full RFM analysis and returns summary statistics.
     * Admin only endpoint.
     */
    @Operation(summary = "Run RFM analysis",
            description = "Performs RFM analysis on all customers and returns segment statistics")
    @PostMapping("/analyze")
    public ResponseEntity<RfmAnalysisResponseDto> runAnalysis(
            @RequestParam(defaultValue = "365") int daysBack) {

        if (daysBack < 1 || daysBack > 3650) {
            return ResponseEntity.badRequest().build();
        }

        RfmAnalysisResponseDto result = rfmAnalysisService.runAnalysis(daysBack);

        return ResponseEntity.ok(result);
    }

    /**
     * Get RFM analysis for the currently authenticated user.
     */
    @Operation(summary = "Get my RFM profile",
            description = "Returns RFM analysis data for the authenticated user")
    @GetMapping("/me")
    public ResponseEntity<CustomerRfmDto> getMyRfm(
            @AuthenticationPrincipal User user) {

        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(user.getUsername());

        if (rfmData == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(rfmData);
    }

    /**
     * Get RFM analysis for a specific customer.
     * Admin endpoint to look up any customer's RFM data.
     */
    @Operation(summary = "Get customer RFM profile",
            description = "Returns RFM analysis data for a specific customer")
    @GetMapping("/customer/{username}")
    public ResponseEntity<CustomerRfmDto> getCustomerRfm(
            @PathVariable String username) {

        CustomerRfmDto rfmData = rfmAnalysisService.getCustomerRfm(username);

        if (rfmData == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(rfmData);
    }

    /**
     * Get RFM analysis for all customers.
     * Admin endpoint to retrieve complete customer segmentation data.
     */
    @Operation(summary = "Get all customers RFM data",
            description = "Returns RFM analysis data for all customers")
    @GetMapping("/customers")
    public ResponseEntity<Map<String, Object>> getAllCustomersRfm() {

        List<CustomerRfmDto> customers = rfmAnalysisService.getAllCustomersRfm();

        Map<String, Object> response = Map.of(
                "count", customers.size(),
                "customers", customers
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get summary statistics for all customer segments.
     * Returns aggregated metrics for each segment (Champions, Loyal, At Risk, etc.)
     */
    @Operation(summary = "Get segment summary",
            description = "Returns summary statistics for all customer segments")
    @GetMapping("/segments")
    public ResponseEntity<Map<String, Object>> getSegmentSummary() {

        List<RfmSegmentSummaryDto> segments = rfmAnalysisService.getSegmentSummary();

        Map<String, Object> response = Map.of(
                "segment_count", segments.size(),
                "segments", segments
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get all customers in a specific segment.
     * Useful for targeted marketing campaigns.
     */
    @Operation(summary = "Get customers by segment",
            description = "Returns all customers belonging to a specific segment")
    @GetMapping("/segment/{segmentName}")
    public ResponseEntity<Map<String, Object>> getCustomersBySegment(
            @PathVariable String segmentName) {

        List<CustomerRfmDto> customers = rfmAnalysisService.getCustomersBySegment(segmentName);

        Map<String, Object> response = Map.of(
                "segment", segmentName,
                "customer_count", customers.size(),
                "customers", customers
        );

        return ResponseEntity.ok(response);
    }

    // ==================== PROMOTION ENDPOINTS ====================

    /**
     * Get all segment-specific offers for the authenticated user.
     * Includes promotions, recommended products, and restaurants.
     */
    @Operation(summary = "Get my segment offers",
            description = "Returns promotions and recommendations based on user's RFM segment")
    @GetMapping("/offers")
    public ResponseEntity<RfmSegmentOffersDto> getMyOffers(
            @AuthenticationPrincipal User user) {

        RfmSegmentOffersDto offers = rfmPromotionService.getSegmentOffers(user);

        return ResponseEntity.ok(offers);
    }

    /**
     * Get promotions for the authenticated user based on their segment.
     */
    @Operation(summary = "Get my promotions",
            description = "Returns applicable promotions for the authenticated user")
    @GetMapping("/promotions")
    public ResponseEntity<List<RfmPromotionDto>> getMyPromotions(
            @AuthenticationPrincipal User user) {

        List<RfmPromotionDto> promotions = rfmPromotionService.getPromotionsForUser(user);

        return ResponseEntity.ok(promotions);
    }

    /**
     * Get free delivery eligibility information.
     */
    @Operation(summary = "Get free delivery info",
            description = "Returns free delivery eligibility based on segment and cart total")
    @GetMapping("/free-delivery")
    public ResponseEntity<FreeDeliveryInfoDto> getFreeDeliveryInfo(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") Double cartTotal) {

        FreeDeliveryInfoDto info = rfmPromotionService.getFreeDeliveryInfo(user, cartTotal);

        return ResponseEntity.ok(info);
    }

    /**
     * Get discount percentage for the authenticated user.
     */
    @Operation(summary = "Get my discount",
            description = "Returns the discount percentage based on user's segment")
    @GetMapping("/discount")
    public ResponseEntity<Map<String, Object>> getMyDiscount(
            @AuthenticationPrincipal User user) {

        int discount = rfmPromotionService.getDiscountForUser(user);
        boolean qualifiesForFreeDelivery = rfmPromotionService.qualifiesForFreeDelivery(user);

        Map<String, Object> response = Map.of(
                "username", user.getUsername(),
                "discountPercent", discount,
                "freeDelivery", qualifiesForFreeDelivery
        );

        return ResponseEntity.ok(response);
    }
}
