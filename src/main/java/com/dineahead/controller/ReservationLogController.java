package com.dineahead.controller;

import com.dineahead.application.ReservationLogService;
import com.dineahead.domain.ReservationLog;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservation-logs")
public class ReservationLogController {

    private final ReservationLogService reservationLogService;

    public ReservationLogController(ReservationLogService reservationLogService) {
        this.reservationLogService = reservationLogService;
    }

    @PostMapping("/reservation/{reservationId}/user/{userId}")
    public ResponseEntity<ReservationLog> addLog(
            @PathVariable Long reservationId,
            @PathVariable Long userId,
            @RequestBody ReservationLog log) {
        return ResponseEntity.ok(reservationLogService.addLog(reservationId, userId, log));
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<List<ReservationLog>> getLogsByReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(reservationLogService.getLogsByReservation(reservationId));
    }
}
