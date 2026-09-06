package com.dineahead.controller;

import com.dineahead.application.PaymentService;
import com.dineahead.domain.Payment;
import com.dineahead.domain.enums.PaymentMethod;
import com.dineahead.domain.enums.PaymentStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process-deposit")
    public ResponseEntity<?> processDeposit(@RequestBody Map<String, Object> paymentRequest) {
        try {
            Long restaurantId = paymentRequest.get("restaurantId") != null ?
                    Long.valueOf(paymentRequest.get("restaurantId").toString()) : null;
            Double amount = paymentRequest.get("amount") != null ?
                    Double.valueOf(paymentRequest.get("amount").toString()) : 0;
            String method = paymentRequest.get("method") != null ?
                    paymentRequest.get("method").toString() : "card";

            Map<String, Object> bookingData = paymentRequest.get("bookingData") != null ?
                    (Map<String, Object>) paymentRequest.get("bookingData") : new HashMap<>();

            PaymentMethod paymentMethod;
            try {
                paymentMethod = PaymentMethod.valueOf(method.toUpperCase());
            } catch (IllegalArgumentException e) {
                paymentMethod = PaymentMethod.CARD;
            }

            Payment payment = new Payment();
            payment.setAmount(BigDecimal.valueOf(amount));
            payment.setPaymentMethod(paymentMethod);
            payment.setStatus(PaymentStatus.SUCCEEDED);

            Payment processedPayment = paymentService.processDeposit(payment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactionId", "txn_" + System.currentTimeMillis());
            response.put("paymentId", processedPayment.getId());
            response.put("amount", amount);
            response.put("message", "Payment processed successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Payment processing failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping
    public ResponseEntity<Payment> processPayment(@RequestBody Payment payment) {
        return ResponseEntity.ok(paymentService.processDeposit(payment));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Payment>> getPaymentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }
}