package com.dineahead.controller;

import com.dineahead.application.RestaurantImageService;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final RestaurantImageService restaurantImageService;

    public HomeController(RestaurantImageService restaurantImageService) {
        this.restaurantImageService = restaurantImageService;
    }

    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getHomeData() {
        Map<String, Object> response = new HashMap<>();

        List<Restaurant> restaurants = restaurantImageService.getAllRestaurantsWithImages();

        List<RestaurantResponseDTO> restaurantDTOs = restaurants.stream()
                .map(restaurant -> {
                    RestaurantResponseDTO dto = new RestaurantResponseDTO(restaurant);
                    dto.setCityImageUrl(restaurant.getCityImageUrl());
                    dto.setCuisineImageUrl(restaurant.getCuisineImageUrl());
                    return dto;
                })
                .collect(Collectors.toList());

        Map<String, Long> cityCounts = restaurantImageService.getCityCounts();
        Map<String, Long> cuisineCounts = restaurantImageService.getCuisineCounts();

        response.put("restaurants", restaurantDTOs);
        response.put("cityCounts", cityCounts);
        response.put("cuisineCounts", cuisineCounts);

        return ResponseEntity.ok(response);
    }
}