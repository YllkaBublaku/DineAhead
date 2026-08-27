package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantHours;
import com.dineahead.infrastructure.RestaurantHoursRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantHoursService {
    private final RestaurantHoursRepository restaurantHoursRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantHoursService(RestaurantHoursRepository restaurantHoursRepository, RestaurantRepository restaurantRepository) {
        this.restaurantHoursRepository = restaurantHoursRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantHours addHours(Long restaurantId, RestaurantHours hours) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow(() -> new RuntimeException("Restaurant not found"));
        hours.setRestaurant(restaurant);
        return restaurantHoursRepository.save(hours);
    }

    public List<RestaurantHours> getHoursByRestaurant(Long restaurantId) {
        return restaurantHoursRepository.findByRestaurantId(restaurantId);
    }
}
