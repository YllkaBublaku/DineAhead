package com.dineahead.infrastructure;

import com.dineahead.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    List<Payment> findByReservationId(Long reservationId);
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
}
