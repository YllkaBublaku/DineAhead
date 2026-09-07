package com.dineahead.application;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.ReservationDTO;
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
import java.util.stream.Collectors;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final RestaurantDepositSettingsRepository depositSettingsRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              RestaurantDepositSettingsRepository depositSettingsRepository) {
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

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByUser(Long userId) {
        List<Reservation> reservations = reservationRepository.findByUserId(userId);
        return reservations.stream()
                .map(ReservationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByRestaurant(Long restaurantId) {
        List<Reservation> reservations = reservationRepository.findByRestaurantId(restaurantId);
        return reservations.stream()
                .map(ReservationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsByRestaurantAndDate(Long restaurantId, LocalDate date) {
        return reservationRepository.findByRestaurantIdAndReservationDate(restaurantId, date);
    }

    @Transactional
    public Reservation confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
    }

    @Transactional
    public ReservationDTO updateReservation(Reservation reservation) {
        Reservation updated = reservationRepository.save(reservation);
        return ReservationDTO.fromEntity(updated);
    }
}