package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantDepositSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantDepositSettingsRepository extends JpaRepository<RestaurantDepositSettings, Long> {

    @Query("SELECT ds FROM RestaurantDepositSettings ds WHERE ds.restaurant.id = :restaurantId")
    Optional<RestaurantDepositSettings> findByRestaurantId(@Param("restaurantId") Long restaurantId);
}
