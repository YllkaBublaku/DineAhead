package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.enums.PriceRange;
import com.dineahead.infrastructure.RestaurantFeatureRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RestaurantService {
    private final RestaurantRepository restaurantRepository;
    private final RestaurantFeatureRepository restaurantFeatureRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, RestaurantFeatureRepository restaurantFeatureRepository) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantFeatureRepository = restaurantFeatureRepository;
    }

    public Restaurant createRestaurant(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    @Transactional(readOnly = true)
    public List<Restaurant> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAllWithFeatures();
        restaurants.forEach(restaurant -> {
            restaurant.getGallery().size();
            restaurant.getRestaurantFeatures().size();
        });
        return restaurants;
    }

    public List<Restaurant> getRestaurantsByCity(String city) {
        return restaurantRepository.findByCity(city);
    }

    @Transactional(readOnly = true)
    public Restaurant getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findByIdWithFeaturesAndDeposit(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + id));

        List<String> gallery = restaurantRepository.findGalleryByRestaurantId(id);
        restaurant.setGallery(gallery);

        return restaurant;
    }

    public List<Restaurant> getRestaurantsByOwner(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }
}