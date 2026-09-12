package com.dineahead.controller;

import com.dineahead.application.*;
import com.dineahead.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    private final RestaurantService restaurantService;
    private final FeatureService featureService;
    private final ReviewService reviewService;
    private final RestaurantImageService restaurantImageService;
    private final AvailabilityService availabilityService;

    public RestaurantController(RestaurantService restaurantService, FeatureService featureService, ReviewService reviewService, RestaurantImageService restaurantImageService, AvailabilityService availabilityService) {
        this.restaurantService = restaurantService;
        this.featureService = featureService;
        this.reviewService = reviewService;
        this.restaurantImageService = restaurantImageService;
        this.availabilityService = availabilityService;
    }

    private RestaurantResponseDTO mapToDTO(Restaurant restaurant) {
        return new RestaurantResponseDTO(restaurant);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantImageService.getAllRestaurantsWithImages();
        List<RestaurantResponseDTO> dtos = restaurants.stream()
                .map(RestaurantResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByCity(@PathVariable String city) {
        List<Restaurant> restaurants = restaurantService.getRestaurantsByCity(city);

        restaurants.forEach(restaurant -> {
            if (restaurant.getCity() != null && restaurant.getCity().getName() != null && !restaurant.getCity().getName().isEmpty()) {
                restaurant.setCityImageUrl(restaurant.getCity().getImageUrl());
            }
            if (restaurant.getCuisineType() != null && !restaurant.getCuisineType().isEmpty()) {
                restaurant.setCuisineImageUrl(com.dineahead.config.ImageConfig.getCuisineImage(restaurant.getCuisineType()));
            }
        });

        return ResponseEntity.ok(restaurants.stream()
                .map(RestaurantResponseDTO::new)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> getRestaurantById(@PathVariable Long id) {
        Restaurant restaurant = restaurantImageService.getRestaurantWithImages(id);
        return ResponseEntity.ok(new RestaurantResponseDTO(restaurant));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByOwner(@PathVariable Long ownerId) {
        List<Restaurant> restaurants = restaurantService.getRestaurantsByOwner(ownerId);

        restaurants.forEach(restaurant -> {
            if (restaurant.getCity() != null && restaurant.getCity().getName() != null && !restaurant.getCity().getName().isEmpty()) {
                restaurant.setCityImageUrl(restaurant.getCity().getImageUrl());
            }
            if (restaurant.getCuisineType() != null && !restaurant.getCuisineType().isEmpty()) {
                restaurant.setCuisineImageUrl(com.dineahead.config.ImageConfig.getCuisineImage(restaurant.getCuisineType()));
            }
        });

        return ResponseEntity.ok(restaurants.stream()
                .map(RestaurantResponseDTO::new)
                .collect(Collectors.toList()));

    }

    @GetMapping("/features")
    public ResponseEntity<List<String>> getAllFeatures() {
        return ResponseEntity.ok(featureService.getAllFeatureNames());
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<ReviewDTO>> getReviewsByRestaurant(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewsByRestaurant(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> updateRestaurant(@PathVariable Long id,
                                                                  @RequestBody Map<String, Object> updates) {
        Restaurant updated = restaurantService.updateRestaurant(id, updates);
        return ResponseEntity.ok(new RestaurantResponseDTO(updated));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityDTO> getAvailability(
            @PathVariable Long id,
            @RequestParam String date,
            @RequestParam(defaultValue = "2") int guests) {
        return ResponseEntity.ok(
                availabilityService.getAvailability(id, LocalDate.parse(date), guests)
        );
    }

    @PostMapping("/availability/batch")
    public ResponseEntity<Map<Long, AvailabilityDTO>> getBatchAvailability(
            @RequestBody Map<String, Object> body) {

        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.get("restaurantIds");
        List<Long> ids = rawIds.stream().map(Long::valueOf).collect(Collectors.toList());

        String dateStr = (String) body.get("date");
        int guests = body.get("guests") != null
                ? Integer.parseInt(body.get("guests").toString())
                : 2;

        return ResponseEntity.ok(
                availabilityService.getBatchAvailability(ids, LocalDate.parse(dateStr), guests)
        );
    }
}