package com.dineahead.controller;

import com.dineahead.application.RestaurantDepositSettingsService;
import com.dineahead.domain.RestaurantDepositSettings;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/deposit-settings")
public class RestaurantDepositSettingsController {

    private final RestaurantDepositSettingsService depositSettingsService;

    public RestaurantDepositSettingsController(RestaurantDepositSettingsService depositSettingsService) {
        this.depositSettingsService = depositSettingsService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<RestaurantDepositSettings> addOrUpdateDepositSettings(
            @PathVariable Long restaurantId,
            @RequestBody RestaurantDepositSettings settings) {
        return ResponseEntity.ok(depositSettingsService.addOrUpdateDepositSettings(restaurantId, settings));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<Optional<RestaurantDepositSettings>> getDepositSettingsByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(depositSettingsService.getDepositSettingsByRestaurant(restaurantId));
    }
}
