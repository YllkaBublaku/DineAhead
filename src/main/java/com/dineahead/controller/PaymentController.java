package com.dineahead.controller;

import com.dineahead.application.PaymentService;
import com.dineahead.domain.Payment;
import com.dineahead.domain.enums.PaymentStatus;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Long reservationId = Long.valueOf(request.get("reservationId").toString());
            Long userId = request.get("userId") != null ?
                    Long.valueOf(request.get("userId").toString()) : null;
            String paymentMethodType = request.get("paymentMethod") != null ?
                    request.get("paymentMethod").toString() : "card";

            String stripePaymentMethod;
            if ("paypal".equals(paymentMethodType)) {
                stripePaymentMethod = "paypal";
            } else {
                stripePaymentMethod = "card";
            }

            Map<String, Object> result = paymentService.createPaymentIntent(reservationId, userId, stripePaymentMethod);
            return ResponseEntity.ok(result);
        } catch (StripeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Payment processing failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, String> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId");
            Payment payment = paymentService.confirmPayment(paymentIntentId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentId", payment.getId());
            response.put("status", payment.getStatus().toString());
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/process-deposit")
    public ResponseEntity<?> processDeposit(@RequestBody Map<String, Object> paymentRequest) {
        try {
            Double amount = paymentRequest.get("amount") != null ?
                    Double.valueOf(paymentRequest.get("amount").toString()) : 0;
            String method = paymentRequest.get("method") != null ?
                    paymentRequest.get("method").toString() : "card";

            Payment payment = new Payment();
            payment.setAmount(java.math.BigDecimal.valueOf(amount));
            payment.setPaymentMethod(com.dineahead.domain.enums.PaymentMethod.valueOf(method.toUpperCase()));
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