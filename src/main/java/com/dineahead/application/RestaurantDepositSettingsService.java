package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantDepositSettings;
import com.dineahead.infrastructure.RestaurantDepositSettingsRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class RestaurantDepositSettingsService {
    private final RestaurantDepositSettingsRepository depositSettingsRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantService restaurantService;

    public RestaurantDepositSettingsService(RestaurantDepositSettingsRepository depositSettingsRepository, RestaurantRepository restaurantRepository, RestaurantService restaurantService) {
        this.depositSettingsRepository = depositSettingsRepository;
        this.restaurantRepository = restaurantRepository;
        this.restaurantService = restaurantService;
    }

    @Transactional
    public RestaurantDepositSettings addOrUpdateDepositSettings(
            Long restaurantId,
            RestaurantDepositSettings incoming) {

        System.out.println("[deposit-save] incoming requiresDeposit=" + incoming.isRequiresDeposit()
                + ", amount=" + incoming.getDepositAmount()
                + ", minParty=" + incoming.getMinPartySizeForDeposit());

        RestaurantDepositSettings existing = depositSettingsRepository
                .findByRestaurantId(restaurantId)
                .orElse(null);

        if (existing == null) {
            Restaurant restaurant = restaurantService.getRestaurantById(restaurantId);
            existing = RestaurantDepositSettings.builder()
                    .restaurant(restaurant)
                    .build();
        }

        existing.setRequiresDeposit(incoming.isRequiresDeposit());

        if (incoming.isRequiresDeposit() && incoming.getDepositAmount() != null) {
            existing.setDepositAmount(incoming.getDepositAmount());
        } else {
            existing.setDepositAmount(BigDecimal.ZERO);
        }

        existing.setMinPartySizeForDeposit(incoming.getMinPartySizeForDeposit());

        return depositSettingsRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public Optional<RestaurantDepositSettings> getDepositSettingsByRestaurant(Long restaurantId) {
        return depositSettingsRepository.findByRestaurantId(restaurantId);
    }

    @Transactional(readOnly = true)
    public List<RestaurantDepositSettings> findRequiringDepositByRestaurantIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return depositSettingsRepository.findRequiringDepositByRestaurantIds(ids);
    }
}
