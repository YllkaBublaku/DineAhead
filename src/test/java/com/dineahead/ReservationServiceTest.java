package com.dineahead;

import com.dineahead.application.BookingEmailService;
import com.dineahead.application.ReservationLogService;
import com.dineahead.application.ReservationService;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private RestaurantDepositSettingsRepository depositSettingsRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReservationLogService reservationLogService;
    @Mock
    private BookingEmailService bookingEmailService;

    @InjectMocks
    private ReservationService reservationService;

    private Reservation testReservation;
    private Restaurant testRestaurant;

    @BeforeEach
    void setUp() {
        testRestaurant = new Restaurant();
        testRestaurant.setId(1L);

        testReservation = new Reservation();
        testReservation.setRestaurant(testRestaurant);
        testReservation.setPartySize(2);
    }

    @Test
    void testCreateReservation_SetsDefaultStatusPending() {
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        Reservation saved = reservationService.createReservation(testReservation);

        assertEquals(ReservationStatus.PENDING, saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void testConfirmReservation_ChangesStatusToConfirmed() {
        testReservation.setId(10L);
        when(reservationRepository.findById(10L)).thenReturn(java.util.Optional.of(testReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        Reservation confirmed = reservationService.confirmReservation(10L);

        assertEquals(ReservationStatus.CONFIRMED, confirmed.getStatus());
    }

    @Test
    void testCancelReservation_ChangesStatusToCancelled() {
        testReservation.setId(11L);
        when(reservationRepository.findById(11L)).thenReturn(java.util.Optional.of(testReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        Reservation cancelled = reservationService.cancelReservation(11L);

        assertEquals(ReservationStatus.CANCELLED, cancelled.getStatus());
    }
}