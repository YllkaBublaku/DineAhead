package com.dineahead.controller;

import com.dineahead.application.RestaurantImageService;
import com.dineahead.domain.RestaurantImage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurant-images")
public class RestaurantImageController {

    private final RestaurantImageService restaurantImageService;

    public RestaurantImageController(RestaurantImageService restaurantImageService) {
        this.restaurantImageService = restaurantImageService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<RestaurantImage> addImage(@PathVariable Long restaurantId, @RequestBody RestaurantImage image) {
        return ResponseEntity.ok(restaurantImageService.addImage(restaurantId, image));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<RestaurantImage>> getImagesByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantImageService.getImagesByRestaurant(restaurantId));
    }
}
