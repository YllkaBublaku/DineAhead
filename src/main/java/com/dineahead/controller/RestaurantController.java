package com.dineahead.controller;

import com.dineahead.application.FeatureService;
import com.dineahead.application.RestaurantService;
import com.dineahead.application.ReviewService;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantResponseDTO;
import com.dineahead.domain.Review;
import com.dineahead.domain.ReviewDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    private final RestaurantService restaurantService;
    private final FeatureService featureService;
    private final ReviewService reviewService;

    public RestaurantController(RestaurantService restaurantService, FeatureService featureService, ReviewService reviewService) {
        this.restaurantService = restaurantService;
        this.featureService = featureService;
        this.reviewService = reviewService;
    }

    private RestaurantResponseDTO mapToDTO(Restaurant restaurant) {
        return new RestaurantResponseDTO(restaurant);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantService.getAllRestaurants();
        List<RestaurantResponseDTO> dtos = restaurants.stream()
                .map(RestaurantResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByCity(@PathVariable String city) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByCity(city).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> getRestaurantById(@PathVariable Long id) {
        Restaurant restaurant = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(new RestaurantResponseDTO(restaurant));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByOwner(ownerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }

    @GetMapping("/features")
    public ResponseEntity<List<String>> getAllFeatures() {
        return ResponseEntity.ok(featureService.getAllFeatureNames());
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<Review>> getReviewsByRestaurant(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewsByRestaurant(id));
    }
}