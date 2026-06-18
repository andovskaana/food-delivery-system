package com.example.food_delivery.service.application.impl;

import com.example.food_delivery.dto.domain.PaymentDto;
import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Payment;
import com.example.food_delivery.model.enums.PaymentProvider;
import com.example.food_delivery.model.enums.PaymentStatus;
import com.example.food_delivery.model.mapper.BasicMappers;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.repository.PaymentRepository;
import com.example.food_delivery.service.application.PaymentApplicationService;
import com.example.food_delivery.service.domain.PaymentService;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentApplicationServiceImpl implements PaymentApplicationService {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    public PaymentApplicationServiceImpl(PaymentService paymentService,
                                         PaymentRepository paymentRepository,
                                         OrderRepository orderRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public PaymentDto createIntent(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        Payment p = paymentService.createOrUpdateIntent(order);
        PaymentDto dto = BasicMappers.toDto(p);

        try {
            if (p.getProviderIntentId() != null && p.getProviderIntentId().startsWith("pi_")) {
                Stripe.apiKey = stripeSecretKey;
                PaymentIntent intent = PaymentIntent.retrieve(p.getProviderIntentId());
                dto.setClientSecret(intent.getClientSecret());
            }
        } catch (Exception ignored) {}

        return dto;
    }

    /**
     * Creates a DEMO cPay payment record (no real Stripe involvement).
     * The frontend should render the cPay-style card form and call
     * /api/payments/{id}/cpay-callback when the "payment" is complete.
     *
     * ⚠️ DEMO ONLY — no real card data is stored or processed.
     */
    @Override
    @Transactional
    public PaymentDto createCpayIntent(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();

        Payment existing = paymentRepository.findAll().stream()
                .filter(p -> p.getOrder().getId().equals(orderId)
                        && p.getProvider() == PaymentProvider.CPAY
                        && p.getStatus() == PaymentStatus.REQUIRES_ACTION)
                .findFirst().orElse(null);

        if (existing != null) {
            return BasicMappers.toDto(existing);
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(PaymentProvider.CPAY);
        payment.setStatus(PaymentStatus.REQUIRES_ACTION);
        payment.setAmount(order.getTotal());
        payment.setCurrency("MKD");
        payment.setProviderIntentId("CPAY-DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Payment saved = paymentRepository.save(payment);
        return BasicMappers.toDto(saved);
    }

    @Override
    public PaymentDto simulateSuccess(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId).orElseThrow();
        return BasicMappers.toDto(paymentService.markSucceeded(p));
    }

    @Override
    public PaymentDto simulateFailure(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId).orElseThrow();
        return BasicMappers.toDto(paymentService.markFailed(p, "simulated"));
    }

    @Override
    public PaymentDto get(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId).orElseThrow();
        return BasicMappers.toDto(p);
    }
}