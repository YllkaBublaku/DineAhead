package com.dineahead.controller;

import com.dineahead.application.RestaurantDepositSettingsService;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.domain.DepositSettingsResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deposit-settings")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class RestaurantDepositSettingsController {

    private final RestaurantDepositSettingsService depositSettingsService;

    public RestaurantDepositSettingsController(RestaurantDepositSettingsService depositSettingsService) {
        this.depositSettingsService = depositSettingsService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<DepositSettingsResponseDTO> addOrUpdateDepositSettings(
            @PathVariable Long restaurantId,
            @RequestBody RestaurantDepositSettings settings) {

        RestaurantDepositSettings saved =
                depositSettingsService.addOrUpdateDepositSettings(restaurantId, settings);

        return ResponseEntity.ok(new DepositSettingsResponseDTO(
                restaurantId,
                saved.isRequiresDeposit(),
                saved.getDepositAmount() != null ? saved.getDepositAmount() : BigDecimal.ZERO
        ));
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

    @PostMapping("/batch")
    public ResponseEntity<Map<Long, BigDecimal>> getBatchDeposits(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.get("restaurantIds");
        if (rawIds == null) return ResponseEntity.ok(Map.of());

        List<Long> ids = rawIds.stream().map(Long::valueOf).collect(Collectors.toList());

        Map<Long, BigDecimal> result = new HashMap<>();
        for (RestaurantDepositSettings s : depositSettingsService.findRequiringDepositByRestaurantIds(ids)) {
            result.put(s.getRestaurant().getId(), s.getDepositAmount() != null ? s.getDepositAmount() : BigDecimal.ZERO);
        }
        return ResponseEntity.ok(result);
    }
}