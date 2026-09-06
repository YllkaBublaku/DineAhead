package com.dineahead.controller;

import com.dineahead.application.RestaurantDepositSettingsService;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.domain.DepositSettingsResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/deposit-settings")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
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
    public ResponseEntity<DepositSettingsResponseDTO> getDepositSettingsByRestaurant(@PathVariable Long restaurantId) {
        Optional<RestaurantDepositSettings> settings = depositSettingsService.getDepositSettingsByRestaurant(restaurantId);

        if (settings.isEmpty()) {
            DepositSettingsResponseDTO response = new DepositSettingsResponseDTO(
                    restaurantId,
                    false,
                    BigDecimal.ZERO
            );
            return ResponseEntity.ok(response);
        }

        RestaurantDepositSettings depositSettings = settings.get();
        DepositSettingsResponseDTO response = new DepositSettingsResponseDTO(
                restaurantId,
                depositSettings.isRequiresDeposit(),
                depositSettings.getDepositAmount() != null ? depositSettings.getDepositAmount() : BigDecimal.ZERO
        );

        return ResponseEntity.ok(response);
    }
}