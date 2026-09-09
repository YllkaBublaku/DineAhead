package com.dineahead.application;

import com.dineahead.config.ImageConfig;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantImage;
import com.dineahead.infrastructure.RestaurantImageRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RestaurantImageService {
    private final RestaurantImageRepository restaurantImageRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantImageService(RestaurantImageRepository restaurantImageRepository, RestaurantRepository restaurantRepository) {
        this.restaurantImageRepository = restaurantImageRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantImage addImage(Long restaurantId, RestaurantImage image) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        image.setRestaurant(restaurant);
        return restaurantImageRepository.save(image);
    }

    public List<RestaurantImage> getImagesByRestaurant(Long restaurantId) {
        return restaurantImageRepository.findByRestaurantId(restaurantId);
    }

    @Transactional(readOnly = true)
    public List<Restaurant> getAllRestaurantsWithImages() {
        List<Restaurant> restaurants = restaurantRepository.findAll();

        restaurants.forEach(restaurant -> {
            if (restaurant.getGallery() != null) {
                restaurant.getGallery().size();
            }

            if (restaurant.getCity() != null && restaurant.getCity().getImageUrl() != null) {
                restaurant.setCityImageUrl(restaurant.getCity().getImageUrl());
            }

            if (restaurant.getCuisineType() != null && !restaurant.getCuisineType().isEmpty()) {
                restaurant.setCuisineImageUrl(ImageConfig.getCuisineImage(restaurant.getCuisineType()));
            }
        });

        return restaurants;
    }

    @Transactional(readOnly = true)
    public Restaurant getRestaurantWithImages(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (restaurant.getGallery() != null) {
            restaurant.getGallery().size();
        }

        if (restaurant.getCity() != null && restaurant.getCity().getImageUrl() != null) {
            restaurant.setCityImageUrl(restaurant.getCity().getImageUrl());
        }

        if (restaurant.getCuisineType() != null && !restaurant.getCuisineType().isEmpty()) {
            restaurant.setCuisineImageUrl(ImageConfig.getCuisineImage(restaurant.getCuisineType()));
        }

        return restaurant;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getCityCounts() {
        return restaurantRepository.findAll().stream()
                .filter(r -> r.getCity() != null && r.getCity().getName() != null && !r.getCity().getName().isEmpty())
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> r.getCity().getName(),
                        java.util.stream.Collectors.counting()
                ));
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getCuisineCounts() {
        return restaurantRepository.findAll().stream()
                .filter(r -> r.getCuisineType() != null && !r.getCuisineType().isEmpty())
                .collect(java.util.stream.Collectors.groupingBy(
                        Restaurant::getCuisineType,
                        java.util.stream.Collectors.counting()
                ));
    }
}