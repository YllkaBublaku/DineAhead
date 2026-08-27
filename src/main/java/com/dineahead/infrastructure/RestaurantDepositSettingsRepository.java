package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantDepositSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantDepositSettingsRepository extends JpaRepository<RestaurantDepositSettings, Long> {
    Optional<RestaurantDepositSettings> findByRestaurantId(Long restaurantId);
}
