package com.dineahead.controller;


import com.dineahead.application.RestaurantOverrideService;
import com.dineahead.domain.RestaurantOverride;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurant-overrides")
public class RestaurantOverrideController {

    private final RestaurantOverrideService restaurantOverrideService;

    public RestaurantOverrideController(RestaurantOverrideService restaurantOverrideService) {
        this.restaurantOverrideService = restaurantOverrideService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<RestaurantOverride> addOverride(@PathVariable Long restaurantId, @RequestBody RestaurantOverride override) {
        return ResponseEntity.ok(restaurantOverrideService.addOverride(restaurantId, override));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<RestaurantOverride>> getOverridesByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantOverrideService.getOverridesByRestaurant(restaurantId));
    }

    @GetMapping("/restaurant/{restaurantId}/date/{date}")
    public ResponseEntity<List<RestaurantOverride>> getOverridesByDate(@PathVariable Long restaurantId, @PathVariable String date) {
        return ResponseEntity.ok(restaurantOverrideService.getOverridesByDate(restaurantId, LocalDate.parse(date)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantOverride> updateOverride(@PathVariable Long id,
                                                             @RequestBody RestaurantOverride updates) {
        return ResponseEntity.ok(restaurantOverrideService.updateOverride(id, updates));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteOverride(@PathVariable Long id) {
        restaurantOverrideService.deleteOverride(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
