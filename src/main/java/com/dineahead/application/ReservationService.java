package com.dineahead.application;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final RestaurantDepositSettingsRepository depositSettingsRepository;

    public ReservationService(ReservationRepository reservationRepository, RestaurantDepositSettingsRepository depositSettingsRepository) {
        this.reservationRepository = reservationRepository;
        this.depositSettingsRepository = depositSettingsRepository;
    }

    @Transactional
    public Reservation createReservation(Reservation reservation) {
        RestaurantDepositSettings depositSettings = depositSettingsRepository
                .findByRestaurantId(reservation.getRestaurant().getId())
                .orElse(null);

        if (depositSettings != null && depositSettings.isRequiresDeposit()) {
            reservation.setDepositAmount(depositSettings.getDepositAmount());
            reservation.setDepositPaid(false);
        } else {
            reservation.setDepositAmount(BigDecimal.ZERO);
            reservation.setDepositPaid(false);
        }

        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setCreatedAt(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getReservationsByUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    public List<Reservation> getReservationsByRestaurant(Long restaurantId) {
        return reservationRepository.findByRestaurantId(restaurantId);
    }

    public List<Reservation> getReservationsByRestaurantAndDate(Long restaurantId, LocalDate date) {
        return reservationRepository.findByRestaurantIdAndReservationDate(restaurantId, date);
    }

    public Reservation confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return reservationRepository.save(reservation);
    }

    public Reservation cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationRepository.save(reservation);
    }
}
