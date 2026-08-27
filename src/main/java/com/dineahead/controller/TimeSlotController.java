package com.dineahead.controller;

import com.dineahead.application.TimeSlotService;
import com.dineahead.domain.TimeSlot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/time-slots")
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    public TimeSlotController(TimeSlotService timeSlotService) {
        this.timeSlotService = timeSlotService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<TimeSlot> addTimeSlot(@PathVariable Long restaurantId, @RequestBody TimeSlot timeSlot) {
        return ResponseEntity.ok(timeSlotService.addTimeSlot(restaurantId, timeSlot));
    }

    @GetMapping("/restaurant/{restaurantId}/active")
    public ResponseEntity<List<TimeSlot>> getActiveTimeSlots(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(timeSlotService.getActiveTimeSlots(restaurantId));
    }
}
