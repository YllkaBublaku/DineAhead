package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantOverride;
import com.dineahead.infrastructure.RestaurantOverrideRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public RestaurantOverride updateOverride(Long id, RestaurantOverride updates) {
        RestaurantOverride existing = restaurantOverrideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Override not found: " + id));

        if (updates.getOverrideDate() != null) existing.setOverrideDate(updates.getOverrideDate());
        if (updates.getOpeningTime() != null) existing.setOpeningTime(updates.getOpeningTime());
        if (updates.getClosingTime() != null) existing.setClosingTime(updates.getClosingTime());
        if (updates.getReason() != null) existing.setReason(updates.getReason());
        existing.setClosed(updates.isClosed());

        return restaurantOverrideRepository.save(existing);
    }

    @Transactional
    public void deleteOverride(Long id) {
        if (!restaurantOverrideRepository.existsById(id)) {
            throw new RuntimeException("Override not found: " + id);
        }
        restaurantOverrideRepository.deleteById(id);
    }
}
