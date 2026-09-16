package com.dineahead.controller;

import com.dineahead.application.BookingEmailService;
import com.dineahead.application.ReservationService;
import com.dineahead.domain.Payment;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.ReservationDTO;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.PaymentRepository;
import com.dineahead.infrastructure.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true",
        allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST,
        RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class ReservationController {

    private static final Logger log = LoggerFactory.getLogger(ReservationController.class);

    private final ReservationService reservationService;
    private final BookingEmailService bookingEmailService;
    private final PaymentRepository paymentRepository;

    public ReservationController(ReservationService reservationService, BookingEmailService bookingEmailService, PaymentRepository paymentRepository) {
        this.reservationService = reservationService;
        this.bookingEmailService = bookingEmailService;
        this.paymentRepository = paymentRepository;
    }

    @PostMapping
    public ResponseEntity<ReservationDTO> createReservation(@RequestBody Reservation reservation) {
        Reservation created = reservationService.createReservation(reservation);
        System.out.println("Reservation created with ID: " + created.getId());

        ReservationDTO dto = ReservationDTO.fromEntity(created);
        System.out.println("DTO: " + dto);
        System.out.println("DTO ID: " + dto.getId());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reservationService.getReservationsByUser(userId));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reservationService.getReservationsByRestaurant(restaurantId));
    }

    @GetMapping("/restaurant/{restaurantId}/date/{date}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByDate(
            @PathVariable Long restaurantId,
            @PathVariable String date) {
        return ResponseEntity.ok(
                reservationService.getReservationsByRestaurantAndDate(restaurantId, LocalDate.parse(date))
        );
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ReservationDTO> confirmReservation(@PathVariable Long id) {
        Reservation updated = reservationService.confirmReservation(id);
        if (updated.getRestaurant() != null) updated.getRestaurant().getName();
        if (updated.getUser() != null) updated.getUser().getFirstName();
        return ResponseEntity.ok(ReservationDTO.fromEntity(updated));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable Long id) {
        Reservation updated = reservationService.cancelReservation(id);
        if (updated.getRestaurant() != null) updated.getRestaurant().getName();
        if (updated.getUser() != null) updated.getUser().getFirstName();
        return ResponseEntity.ok(ReservationDTO.fromEntity(updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationDTO> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        String statusStr = (String) body.get("status");
        Long userId = body.get("userId") != null
                ? Long.valueOf(body.get("userId").toString())
                : null;

        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }

        ReservationStatus status;
        try {
            status = ReservationStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(reservationService.changeStatus(id, status, userId));
    }

    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<ReservationDTO> updateReservation(@PathVariable Long id, @RequestBody Map<String, Object> updates) {

        Reservation reservation = reservationService.getReservationById(id);

        if (reservation == null) {
            log.error("Reservation not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }

        ReservationStatus previousStatus = reservation.getStatus();

        if (updates.containsKey("depositPaid")) {
            Boolean depositPaid = (Boolean) updates.get("depositPaid");
            reservation.setDepositPaid(depositPaid);
            log.info("Set depositPaid to: {}", depositPaid);
        }

        if (updates.containsKey("depositAmount")) {
            Object amount = updates.get("depositAmount");
            if (amount instanceof Number) {
                BigDecimal depositAmount = BigDecimal.valueOf(((Number) amount).doubleValue());
                reservation.setDepositAmount(depositAmount);
                log.info("Set depositAmount to: {}", depositAmount);
            }
        }

        if (updates.containsKey("status")) {
            String statusStr = (String) updates.get("status");
            try {
                ReservationStatus status = ReservationStatus.valueOf(statusStr.toUpperCase());
                reservation.setStatus(status);
                log.info("Set status to: {}", status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}, setting to PENDING", statusStr);
                reservation.setStatus(ReservationStatus.PENDING);
            }
        }

        ReservationDTO dto = reservationService.updateReservation(reservation);

        boolean justConfirmed = previousStatus != ReservationStatus.CONFIRMED
                && reservation.getStatus() == ReservationStatus.CONFIRMED;

        if (justConfirmed) {
            Payment payment = paymentRepository
                    .findByReservationId(reservation.getId())
                    .orElse(null);

            try {
                bookingEmailService.sendBookingConfirmation(reservation, payment);
            } catch (Exception e) {
                System.err.println("[ReservationController] Email send failed: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationDTO> getReservationById(@PathVariable Long id) {
        try {
            Reservation reservation = reservationService.getReservationById(id);
            return ResponseEntity.ok(ReservationDTO.fromEntity(reservation));
        } catch (RuntimeException e) {
            log.error("Reservation not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/restaurant/{restaurantId}/stats")
    public ResponseEntity<com.dineahead.domain.RestaurantStatsDTO> getStats(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reservationService.getStatsForRestaurant(restaurantId));
    }
}