package com.dineahead.controller;

import com.dineahead.application.RestaurantService;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantResponseDTO;
import com.dineahead.domain.enums.PriceRange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    private RestaurantResponseDTO mapToDTO(Restaurant restaurant) {
        return new RestaurantResponseDTO(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getSlug(),
                restaurant.getAddress(),
                restaurant.getCity(),
                restaurant.getCuisineType(),
                restaurant.getPriceRange(),
                restaurant.getCoverPhotoUrl(),
                restaurant.getSpecialOffer(),
                new java.util.ArrayList<>(), // Force empty gallery
                restaurant.getAverageRating(),
                restaurant.getReviewCount(),
                restaurant.getLatitude(),
                restaurant.getLongitude()
        );
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRestaurants(
            @RequestParam(defaultValue = "Paris") String city,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "") String cuisine,
            @RequestParam(required = false) PriceRange price,
            @RequestParam(defaultValue = "false") boolean specialOffers,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "averageRating") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
        Page<Restaurant> restaurantPage = restaurantService.getFilteredRestaurants(city, query, cuisine, price, specialOffers, pageable);

        List<RestaurantResponseDTO> content = restaurantPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", restaurantPage.getTotalElements(),
                "totalPages", restaurantPage.getTotalPages(),
                "currentPage", restaurantPage.getNumber()
        ));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByCity(@PathVariable String city) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByCity(city).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(mapToDTO(restaurantService.getRestaurantById(id)));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByOwner(ownerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }
}