package com.dineahead.application;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.ReservationLog;
import com.dineahead.domain.User;
import com.dineahead.infrastructure.ReservationLogRepository;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationLogService {
    private final ReservationLogRepository reservationLogRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public ReservationLogService(ReservationLogRepository reservationLogRepository,
                                 ReservationRepository reservationRepository,
                                 UserRepository userRepository) {
        this.reservationLogRepository = reservationLogRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
    }

    public ReservationLog addLog(Long reservationId, Long userId, ReservationLog log) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.setReservation(reservation);
        log.setChangedBy(user);
        log.setTimestamp(LocalDateTime.now());
        return reservationLogRepository.save(log);
    }

    public List<ReservationLog> getLogsByReservation(Long reservationId) {
        return reservationLogRepository.findByReservationId(reservationId);
    }
}
