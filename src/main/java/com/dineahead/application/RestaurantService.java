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
import java.util.Map;

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

    @Transactional
    public Restaurant updateRestaurant(Long id, Map<String, Object> updates) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + id));

        if (updates.containsKey("name")) restaurant.setName((String) updates.get("name"));
        if (updates.containsKey("address")) restaurant.setAddress((String) updates.get("address"));
        if (updates.containsKey("phone")) restaurant.setPhone((String) updates.get("phone"));
        if (updates.containsKey("description")) restaurant.setDescription((String) updates.get("description"));
        if (updates.containsKey("cuisineType")) restaurant.setCuisineType((String) updates.get("cuisineType"));
        if (updates.containsKey("priceRange")) restaurant.setPriceRange((String) updates.get("priceRange"));
        if (updates.containsKey("specialOffer")) restaurant.setSpecialOffer((String) updates.get("specialOffer"));
        if (updates.containsKey("coverPhotoUrl")) restaurant.setCoverPhotoUrl((String) updates.get("coverPhotoUrl"));

        return restaurantRepository.save(restaurant);
    }

}