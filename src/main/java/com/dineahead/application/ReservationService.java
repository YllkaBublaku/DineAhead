package com.dineahead.application;

import com.dineahead.domain.*;
import com.dineahead.domain.enums.PaymentMethod;
import com.dineahead.domain.enums.ReservationAction;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {
    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);
    private final ReservationRepository reservationRepository;
    private final RestaurantDepositSettingsRepository depositSettingsRepository;
    private final UserRepository userRepository;
    private final ReservationLogService reservationLogService;

    public ReservationService(ReservationRepository reservationRepository,
                              RestaurantDepositSettingsRepository depositSettingsRepository,
                              UserRepository userRepository,
                              ReservationLogService reservationLogService) {
        this.reservationRepository = reservationRepository;
        this.depositSettingsRepository = depositSettingsRepository;
        this.userRepository = userRepository;
        this.reservationLogService = reservationLogService;
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

        if (reservation.getPaymentMethod() == null) {
            reservation.setPaymentMethod(PaymentMethod.CARD);
        }

        if (reservation.getUser() != null && reservation.getUser().getId() != null) {
            User user = userRepository.findById(reservation.getUser().getId())
                    .orElse(null);
            if (user != null) {
                reservation.setUser(user);
                log.info("User loaded: {} with email: {}", user.getId(), user.getEmail());
            }
        }

        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation created with ID: {}", saved.getId());

        if (saved.getUser() != null) {
            log.info("Reservation user email: {}", saved.getUser().getEmail());
        }

        return saved;
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

    @Transactional(readOnly = true)
    public RestaurantStatsDTO getStatsForRestaurant(Long restaurantId) {
        LocalDate today = LocalDate.now();

        long todayBookings = reservationRepository.countByRestaurantAndDate(restaurantId, today);
        long upcoming = reservationRepository.countUpcoming(restaurantId, today);

        long total = reservationRepository.countByRestaurantAndDate(restaurantId, today);
        long noShows = reservationRepository.countByRestaurantAndStatus(restaurantId, ReservationStatus.NO_SHOW);

        String noShowRate;
        if (total == 0) {
            noShowRate = "0%";
        } else {
            double rate = (noShows * 100.0) / total;
            noShowRate = String.format("%.1f%%", rate);
        }

        BigDecimal revenue = reservationRepository.sumRevenueForDate(restaurantId, today);
        if (revenue == null) revenue = BigDecimal.ZERO;

        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        List<BigDecimal> weekRevenue = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            BigDecimal dayRev = reservationRepository.sumRevenueForDate(restaurantId, day);
            weekRevenue.add(dayRev != null ? dayRev : BigDecimal.ZERO);
        }

        return new RestaurantStatsDTO(todayBookings, upcoming, noShowRate, revenue, weekRevenue);
    }

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByRestaurantAndDate(Long restaurantId, LocalDate date) {
        List<Reservation> reservations = reservationRepository
                .findByRestaurantIdAndReservationDate(restaurantId, date);

        reservations.forEach(r -> {
            if (r.getRestaurant() != null) r.getRestaurant().getName();
            if (r.getUser() != null) {
                r.getUser().getFirstName();
                r.getUser().getLastName();
                r.getUser().getEmail();
            }
        });

        return reservations.stream()
                .map(ReservationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReservationDTO changeStatus(Long reservationId, ReservationStatus newStatus, Long changedByUserId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));

        reservation.setStatus(newStatus);
        Reservation saved = reservationRepository.save(reservation);

        ReservationLog logEntry = ReservationLog.builder()
                .action(mapStatusToAction(newStatus))
                .timestamp(LocalDateTime.now())
                .build();
        reservationLogService.addLog(saved.getId(), changedByUserId, logEntry);

        return ReservationDTO.fromEntity(saved);
    }

    private ReservationAction mapStatusToAction(ReservationStatus status) {
        switch (status) {
            case CONFIRMED: return ReservationAction.CONFIRMED;
            case CANCELLED: return ReservationAction.CANCELLED;
            case SEATED:    return ReservationAction.SEATED;
            case NO_SHOW:   return ReservationAction.NO_SHOW;
            default:        return ReservationAction.MODIFIED;
        }
    }
}