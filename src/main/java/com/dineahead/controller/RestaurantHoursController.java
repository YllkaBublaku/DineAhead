package com.dineahead.controller;

import com.dineahead.application.RestaurantHoursService;
import com.dineahead.domain.RestaurantHours;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurant-hours")
public class RestaurantHoursController {

    private final RestaurantHoursService restaurantHoursService;

    public RestaurantHoursController(RestaurantHoursService restaurantHoursService) {
        this.restaurantHoursService = restaurantHoursService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<RestaurantHours> addHours(@PathVariable Long restaurantId, @RequestBody RestaurantHours hours) {
        return ResponseEntity.ok(restaurantHoursService.addHours(restaurantId, hours));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<RestaurantHours>> getHoursByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantHoursService.getHoursByRestaurant(restaurantId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantHours> updateHours(@PathVariable Long id,
                                                       @RequestBody RestaurantHours updates) {
        return ResponseEntity.ok(restaurantHoursService.updateHours(id, updates));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteHours(@PathVariable Long id) {
        restaurantHoursService.deleteHours(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
