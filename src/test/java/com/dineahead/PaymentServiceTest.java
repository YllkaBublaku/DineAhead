package com.dineahead;

import com.dineahead.application.BookingEmailService;
import com.dineahead.application.PaymentService;
import com.dineahead.domain.Payment;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.enums.PaymentMethod;
import com.dineahead.domain.enums.PaymentStatus;
import com.dineahead.infrastructure.PaymentRepository;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestaurantDepositSettingsRepository depositSettingsRepository;
    @Mock private BookingEmailService bookingEmailService;

    @InjectMocks
    private PaymentService paymentService;

    private Reservation testReservation;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);
        restaurant.setName("Tapas del Mar");

        testReservation = new Reservation();
        testReservation.setId(100L);
        testReservation.setRestaurant(restaurant);
        testReservation.setDepositAmount(new BigDecimal("20.00"));

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setReservation(testReservation);
        testPayment.setDepositAmount(new BigDecimal("20.00"));
        testPayment.setStripePaymentIntentId("pi_12345");
    }

    @Test
    void testCreatePaymentIntent_ReservationNotFound_ThrowsException() {
        when(reservationRepository.findById(999L)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            paymentService.createPaymentIntent(999L, 1L);
        });

        assertTrue(exception.getMessage().contains("Reservation not found"));
    }

    @Test
    void testConfirmPayment_StripeSucceeded_UpdatesStatusAndReservation() throws StripeException {
        when(paymentRepository.findByStripePaymentIntentId("pi_12345")).thenReturn(Optional.of(testPayment));

        PaymentIntent mockIntent = mock(PaymentIntent.class);
        when(mockIntent.getStatus()).thenReturn("succeeded");

        try (MockedStatic<PaymentIntent> mockedStatic = Mockito.mockStatic(PaymentIntent.class)) {
            mockedStatic.when(() -> PaymentIntent.retrieve("pi_12345")).thenReturn(mockIntent);

            Payment result = paymentService.confirmPayment("pi_12345");

            assertEquals(PaymentStatus.SUCCEEDED, result.getStatus());
            assertTrue(result.getReservation().getDepositPaid());
            verify(reservationRepository, times(1)).save(testReservation);
            verify(paymentRepository, times(1)).save(testPayment);
        }
    }

    @Test
    void testConfirmPayment_StripeFailed_UpdatesStatusToFailed() throws StripeException {
        when(paymentRepository.findByStripePaymentIntentId("pi_12345")).thenReturn(Optional.of(testPayment));

        PaymentIntent mockIntent = mock(PaymentIntent.class);
        when(mockIntent.getStatus()).thenReturn("requires_payment_method");

        try (MockedStatic<PaymentIntent> mockedStatic = Mockito.mockStatic(PaymentIntent.class)) {
            mockedStatic.when(() -> PaymentIntent.retrieve("pi_12345")).thenReturn(mockIntent);

            Payment result = paymentService.confirmPayment("pi_12345");

            assertEquals(PaymentStatus.FAILED, result.getStatus());
            assertFalse(result.getReservation().getDepositPaid());
            verify(reservationRepository, never()).save(any());
            verify(paymentRepository, times(1)).save(testPayment);
        }
    }

    @Test
    void testProcessDeposit_Success() {
        Payment newPayment = new Payment();
        newPayment.setReservation(testReservation);
        newPayment.setDepositAmount(null);

        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        Payment result = paymentService.processDeposit(newPayment);

        assertEquals(PaymentStatus.SUCCEEDED, result.getStatus());
        assertEquals(new BigDecimal("20.00"), result.getDepositAmount());
        assertNotNull(result.getCreatedAt());
    }
}