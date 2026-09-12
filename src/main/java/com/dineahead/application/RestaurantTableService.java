package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantTable;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.RestaurantTableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (table.getMinCapacity() != null && table.getMaxCapacity() != null
                && table.getMinCapacity() > table.getMaxCapacity()) {
            throw new RuntimeException("Minimum capacity cannot exceed maximum capacity");
        }

        if (table.getStatus() == null || table.getStatus().isBlank()) {
            table.setStatus("Available");
        }

        table.setRestaurant(restaurant);
        return restaurantTableRepository.save(table);
    }

    @Transactional
    public RestaurantTable updateTable(Long id, RestaurantTable updates) {
        RestaurantTable existing = restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found: " + id));

        if (updates.getTableNumber() != null) existing.setTableNumber(updates.getTableNumber());
        if (updates.getMinCapacity() != null) existing.setMinCapacity(updates.getMinCapacity());
        if (updates.getMaxCapacity() != null) existing.setMaxCapacity(updates.getMaxCapacity());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());

        if (existing.getMinCapacity() != null && existing.getMaxCapacity() != null
                && existing.getMinCapacity() > existing.getMaxCapacity()) {
            throw new RuntimeException("Minimum capacity cannot exceed maximum capacity");
        }

        return restaurantTableRepository.save(existing);
    }

    @Transactional
    public void deleteTable(Long id) {
        if (!restaurantTableRepository.existsById(id)) {
            throw new RuntimeException("Table not found: " + id);
        }
        restaurantTableRepository.deleteById(id);
    }

    public List<RestaurantTable> getTablesByRestaurant(Long restaurantId) {
        return restaurantTableRepository.findByRestaurantId(restaurantId);
    }
}
