package com.dineahead.application;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.ReservationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;

    public ReservationService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public Reservation createReservation(Reservation reservation) {
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setDepositStatus(com.dineahead.domain.enums.DepositStatus.NOT_REQUIRED);
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
