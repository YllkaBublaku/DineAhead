package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantTable;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.RestaurantTableRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantTableService {
    private final RestaurantTableRepository restaurantTableRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantTableService(RestaurantTableRepository restaurantTableRepository, RestaurantRepository restaurantRepository) {
        this.restaurantTableRepository = restaurantTableRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantTable addTable(Long restaurantId, RestaurantTable table) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow(() -> new RuntimeException("Restaurant not found"));
        table.setRestaurant(restaurant);
        return restaurantTableRepository.save(table);
    }

    public List<RestaurantTable> getTablesByRestaurant(Long restaurantId) {
        return restaurantTableRepository.findByRestaurantId(restaurantId);
    }
}
