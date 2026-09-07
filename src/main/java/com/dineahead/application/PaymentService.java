package com.dineahead.application;

import com.dineahead.domain.Payment;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.domain.User;
import com.dineahead.domain.enums.PaymentMethod;
import com.dineahead.domain.enums.PaymentStatus;
import com.dineahead.infrastructure.PaymentRepository;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RestaurantDepositSettingsRepository depositSettingsRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          ReservationRepository reservationRepository,
                          UserRepository userRepository,
                          RestaurantDepositSettingsRepository depositSettingsRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.depositSettingsRepository = depositSettingsRepository;
    }

    @Transactional
    public Map<String, Object> createPaymentIntent(Long reservationId, Long userId, String paymentMethodType) throws StripeException {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        BigDecimal depositAmount = getDepositAmountForReservation(reservation);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(depositAmount.multiply(BigDecimal.valueOf(100)).longValue())
                .setCurrency("eur")
                .addPaymentMethodType(paymentMethodType)
                .setDescription("Deposit for " + reservation.getRestaurant().getName())
                .putMetadata("reservationId", reservationId.toString())
                .putMetadata("restaurantName", reservation.getRestaurant().getName())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setUser(user);
        payment.setAmount(depositAmount);
        payment.setDepositAmount(depositAmount);
        payment.setPaymentMethod(PaymentMethod.valueOf(paymentMethodType.toUpperCase()));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setStripePaymentIntentId(paymentIntent.getId());
        payment.setCreatedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        Map<String, Object> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());
        response.put("paymentIntentId", paymentIntent.getId());
        response.put("amount", depositAmount);

        return response;
    }

    private BigDecimal getDepositAmountForReservation(Reservation reservation) {
        if (reservation.getDepositAmount() != null &&
                reservation.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            return reservation.getDepositAmount();
        }

        RestaurantDepositSettings depositSettings = depositSettingsRepository
                .findByRestaurantId(reservation.getRestaurant().getId())
                .orElse(null);

        if (depositSettings != null && depositSettings.isRequiresDeposit()) {
            return depositSettings.getDepositAmount() != null ?
                    depositSettings.getDepositAmount() : BigDecimal.ZERO;
        }

        return BigDecimal.ZERO;
    }

    @Transactional
    public Payment confirmPayment(String paymentIntentId) throws StripeException {
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if ("succeeded".equals(paymentIntent.getStatus())) {
            payment.setStatus(PaymentStatus.SUCCEEDED);
            paymentRepository.save(payment);

            Reservation reservation = payment.getReservation();
            reservation.setDepositPaid(true);
            reservation.setDepositAmount(payment.getDepositAmount());
            reservationRepository.save(reservation);
        }

        return payment;
    }

    @Transactional
    public Payment processDeposit(Payment payment) {
        if (payment.getDepositAmount() == null) {
            BigDecimal depositAmount = getDepositAmountForReservation(payment.getReservation());
            payment.setDepositAmount(depositAmount);
        }

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setCreatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
}