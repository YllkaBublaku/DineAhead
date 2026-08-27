package com.dineahead.controller;

import com.dineahead.application.RestaurantTableService;
import com.dineahead.domain.RestaurantTable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}