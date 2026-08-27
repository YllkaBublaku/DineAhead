package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantHoursRepository extends JpaRepository<RestaurantHours, Long> {
    List<RestaurantHours> findByRestaurantId(Long restaurantId);
}
