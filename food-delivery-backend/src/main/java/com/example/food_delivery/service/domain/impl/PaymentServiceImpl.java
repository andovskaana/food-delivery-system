package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Payment;
import com.example.food_delivery.model.enums.PaymentStatus;
import com.example.food_delivery.repository.PaymentRepository;
import com.example.food_delivery.service.domain.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.exception.StripeException;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    public PaymentServiceImpl(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public Payment createOrUpdateIntent(Order order) {
        Payment payment = paymentRepository.findByOrder(order).orElseGet(Payment::new);
        payment.setOrder(order);

        Double amount = order.getTotal();
        if (amount == null) amount = 0.0;
        payment.setAmount(amount);
        payment.setCurrency("usd");

        try {
            Stripe.apiKey = stripeSecretKey;
            long amountInCents = Math.round(payment.getAmount() * 100);
            if (payment.getProviderIntentId() == null) {
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(amountInCents)
                        .setCurrency(payment.getCurrency())
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
                        )
                        .build();
                PaymentIntent intent = PaymentIntent.create(params);
                payment.setProviderIntentId(intent.getId());
            }
        } catch (StripeException e) {
            if (payment.getProviderIntentId() == null) {
                payment.setProviderIntentId("pi_" + UUID.randomUUID());
            }
        }

        payment.setStatus(PaymentStatus.REQUIRES_ACTION);
        return paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public Payment markSucceeded(Payment payment) {
        payment.setStatus(PaymentStatus.CAPTURED);
        return paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public Payment markFailed(Payment payment, String reason) {
        payment.setStatus(PaymentStatus.FAILED);
        return paymentRepository.save(payment);
    }
}