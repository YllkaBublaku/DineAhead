package com.dineahead.controller;

import com.dineahead.application.RestaurantTableService;
import com.dineahead.domain.RestaurantTable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurant-tables")
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    public RestaurantTableController(RestaurantTableService restaurantTableService) {
        this.restaurantTableService = restaurantTableService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<RestaurantTable> addTable(@PathVariable Long restaurantId, @RequestBody RestaurantTable table) {
        return ResponseEntity.ok(restaurantTableService.addTable(restaurantId, table));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<RestaurantTable>> getTablesByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantTableService.getTablesByRestaurant(restaurantId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(@PathVariable Long id,
                                                       @RequestBody RestaurantTable updates) {
        return ResponseEntity.ok(restaurantTableService.updateTable(id, updates));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTable(@PathVariable Long id) {
        restaurantTableService.deleteTable(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}