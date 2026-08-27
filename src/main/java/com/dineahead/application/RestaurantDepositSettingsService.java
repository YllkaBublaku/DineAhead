package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RestaurantDepositSettingsService {
    private final RestaurantDepositSettingsRepository depositSettingsRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantDepositSettingsService(RestaurantDepositSettingsRepository depositSettingsRepository, RestaurantRepository restaurantRepository) {
        this.depositSettingsRepository = depositSettingsRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantDepositSettings addOrUpdateDepositSettings(Long restaurantId, RestaurantDepositSettings settings) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow(() -> new RuntimeException("Restaurant not found"));
        settings.setRestaurant(restaurant);
        return depositSettingsRepository.save(settings);
    }

    public Optional<RestaurantDepositSettings> getDepositSettingsByRestaurant(Long restaurantId) {
        return depositSettingsRepository.findByRestaurantId(restaurantId);
    }
}
