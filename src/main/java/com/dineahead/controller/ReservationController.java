package com.dineahead.controller;

import com.dineahead.application.ReservationService;
import com.dineahead.domain.Reservation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<Reservation> createReservation(@RequestBody Reservation reservation) {
        return ResponseEntity.ok(reservationService.createReservation(reservation));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Reservation>> getReservationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reservationService.getReservationsByUser(userId));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Reservation>> getReservationsByRestaurant(@PathVariable Long restaurantId) {
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
}
