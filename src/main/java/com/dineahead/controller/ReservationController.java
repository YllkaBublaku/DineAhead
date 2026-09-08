package com.dineahead.controller;

import com.dineahead.application.ReservationService;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.ReservationDTO;
import com.dineahead.domain.enums.ReservationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true",
        allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST,
        RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class ReservationController {

    private static final Logger log = LoggerFactory.getLogger(ReservationController.class);

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
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
    public ResponseEntity<List<Reservation>> getReservationsByDate(@PathVariable Long restaurantId, @PathVariable String date) {
        return ResponseEntity.ok(reservationService.getReservationsByRestaurantAndDate(restaurantId, LocalDate.parse(date)));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Reservation> confirmReservation(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.confirmReservation(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Reservation> cancelReservation(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.cancelReservation(id));
    }

    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<ReservationDTO> updateReservation(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        log.info("Updating reservation with id: {}", id);
        log.info("Updates: {}", updates);

        Reservation reservation = reservationService.getReservationById(id);

        if (reservation == null) {
            log.error("Reservation not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }

        log.info("Found reservation: {}", reservation.getId());

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
        log.info("Updated reservation: {}", dto.getId());
        log.info("DTO created: {}", dto);

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
}