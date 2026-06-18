package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.PaymentDto;
import com.example.food_delivery.model.enums.PaymentProvider;
import com.example.food_delivery.service.application.PaymentApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "payment-controller")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentApplicationService paymentApplicationService;

    public PaymentController(PaymentApplicationService paymentApplicationService) {
        this.paymentApplicationService = paymentApplicationService;
    }

    @Operation(summary = "Create or update a PaymentIntent for an order")
    @PostMapping("/{orderId}/intent")
    public ResponseEntity<PaymentDto> intent(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentApplicationService.createIntent(orderId));
    }

    /**
     * Create a cPay/CASYS-style demo payment for an order.
     * [DEMO - no real payment processing]
     */
    @Operation(summary = "Create a DEMO cPay (CASYS-style Macedonian) payment for an order")
    @PostMapping("/{orderId}/cpay-intent")
    public ResponseEntity<PaymentDto> cpayIntent(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentApplicationService.createCpayIntent(orderId));
    }

    @Operation(summary = "Simulate a successful capture for a payment")
    @PostMapping("/{paymentId}/simulate-success")
    public ResponseEntity<PaymentDto> simulateSuccess(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentApplicationService.simulateSuccess(paymentId));
    }

    @Operation(summary = "Simulate a failed payment")
    @PostMapping("/{paymentId}/simulate-failure")
    public ResponseEntity<PaymentDto> simulateFailure(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentApplicationService.simulateFailure(paymentId));
    }

    /**
     * Webhook-style callback from cPay demo flow.
     * In real cPay integration this would be a redirect back from cPay's server.
     * Here we simulate it: POST /api/payments/{paymentId}/cpay-callback?success=true
     */
    @Operation(summary = "[DEMO] cPay callback — simulates redirect back from cPay server")
    @PostMapping("/{paymentId}/cpay-callback")
    public ResponseEntity<PaymentDto> cpayCallback(
            @PathVariable Long paymentId,
            @RequestParam(defaultValue = "true") boolean success,
            @RequestParam(required = false) String cPayPaymentRef) {
        if (success) {
            return ResponseEntity.ok(paymentApplicationService.simulateSuccess(paymentId));
        } else {
            return ResponseEntity.ok(paymentApplicationService.simulateFailure(paymentId));
        }
    }

    @Operation(summary = "Get payment by id")
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDto> get(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentApplicationService.get(paymentId));
    }
}
