package com.dineahead.application;

import com.dineahead.domain.MenuItem;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.TimeSlot;
import com.dineahead.infrastructure.MenuItemRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.TimeSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RestaurantService {
    private static final Logger log = LoggerFactory.getLogger(RestaurantService.class);

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final CityService cityService;

    public RestaurantService(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository, TimeSlotRepository timeSlotRepository, CityService cityService) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.cityService = cityService;
    }

    public Restaurant createRestaurant(Restaurant restaurant) {
        if (restaurant.getCreatedAt() == null) {
            restaurant.setCreatedAt(LocalDateTime.now());
        }
        Restaurant saved = restaurantRepository.save(restaurant);
        try {
            cityService.updateCityRestaurantCounts();
        } catch (Exception e) {
            log.warn("City count update failed after restaurant {} creation", saved.getId(), e);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Restaurant> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAllWithFeatures();

        restaurants.forEach(restaurant -> {
            if (restaurant.getGallery() != null) {
                restaurant.getGallery().size();
            }
            if (restaurant.getRestaurantFeatures() != null) {
                restaurant.getRestaurantFeatures().size();
            }

            List<TimeSlot> timeSlots = timeSlotRepository.findByRestaurantIdAndIsActiveTrue(restaurant.getId());
            restaurant.setTimeSlots(timeSlots);

            List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(restaurant.getId());
            restaurant.setMenuItems(menuItems);
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

        List<TimeSlot> timeSlots = timeSlotRepository.findByRestaurantIdAndIsActiveTrue(id);
        restaurant.setTimeSlots(timeSlots);

        List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(id);
        restaurant.setMenuItems(menuItems);

        return restaurant;
    }

    public List<Restaurant> getRestaurantsByOwner(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }
}