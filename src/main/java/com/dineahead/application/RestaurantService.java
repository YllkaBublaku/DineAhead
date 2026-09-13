package com.dineahead.application;

import com.dineahead.domain.*;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.MenuItemRepository;
import com.dineahead.infrastructure.ReservationRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.TimeSlotRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final ReservationRepository reservationRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository, TimeSlotRepository timeSlotRepository, CityService cityService, ReservationRepository reservationRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.cityService = cityService;
        this.reservationRepository = reservationRepository;
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

    @Transactional
    public void deactivateRestaurant(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        r.setIsActive(false);
        restaurantRepository.save(r);
    }

    @Transactional
    public void activateRestaurant(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        r.setIsActive(true);
        restaurantRepository.save(r);
    }

    @Transactional
    public void deleteRestaurant(Long id, String password, PasswordEncoder passwordEncoder) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        User owner = r.getOwner();
        if (owner == null) {
            throw new RuntimeException("No owner linked to this restaurant.");
        }

        if (owner.getPasswordHash() != null && !owner.getPasswordHash().isBlank()) {
            if (password == null || !passwordEncoder.matches(password, owner.getPasswordHash())) {
                throw new BadCredentialsException("Incorrect password.");
            }
        }

        List<Reservation> reservations = reservationRepository.findByRestaurantId(id);
        for (Reservation rv : reservations) {
            if (rv.getStatus() != null
                    && rv.getStatus() != ReservationStatus.CANCELLED
                    && rv.getStatus() != ReservationStatus.NO_SHOW) {
                rv.setStatus(ReservationStatus.CANCELLED);
            }
        }
        reservationRepository.saveAll(reservations);

        r.setOwner(null);
        restaurantRepository.save(r);
        restaurantRepository.delete(r);
    }
}
