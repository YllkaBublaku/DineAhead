package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RestaurantOverrideRepository extends JpaRepository<RestaurantOverride, Long> {
    List<RestaurantOverride> findByRestaurantId(Long restaurantId);
    List<RestaurantOverride> findByRestaurantIdAndOverrideDate(Long restaurantId, LocalDate date);
}
