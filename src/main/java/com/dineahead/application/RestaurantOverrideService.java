package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantOverride;
import com.dineahead.infrastructure.RestaurantOverrideRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RestaurantOverrideService {
    private final RestaurantOverrideRepository restaurantOverrideRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantOverrideService(RestaurantOverrideRepository restaurantOverrideRepository, RestaurantRepository restaurantRepository) {
        this.restaurantOverrideRepository = restaurantOverrideRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantOverride addOverride(Long restaurantId, RestaurantOverride override) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow(() -> new RuntimeException("Restaurant not found"));
        override.setRestaurant(restaurant);
        return restaurantOverrideRepository.save(override);
    }

    public List<RestaurantOverride> getOverridesByRestaurant(Long restaurantId) {
        return restaurantOverrideRepository.findByRestaurantId(restaurantId);
    }

    public List<RestaurantOverride> getOverridesByDate(Long restaurantId, LocalDate date) {
        return restaurantOverrideRepository.findByRestaurantIdAndOverrideDate(restaurantId, date);
    }
}
