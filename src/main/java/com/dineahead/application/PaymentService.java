package com.dineahead.application;

import com.dineahead.domain.Payment;
import com.dineahead.domain.enums.PaymentStatus;
import com.dineahead.infrastructure.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment processDeposit(Payment payment) {
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setCreatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
}
