package com.dineahead.application;

import com.dineahead.domain.*;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final UserRepository userRepository;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             MenuItemRepository menuItemRepository,
                             TimeSlotRepository timeSlotRepository,
                             CityService cityService,
                             ReservationRepository reservationRepository,
                             UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.cityService = cityService;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
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


    public List<Restaurant> getRestaurantsByCity(String city) {
        return restaurantRepository.findByCity(city);
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponseDTO> getAllRestaurants() {
        return restaurantRepository.findAllWithMenuItems().stream()
                .map(RestaurantResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public Restaurant getRestaurantEntity(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + id));
    }

    @Transactional(readOnly = true)
    public RestaurantResponseDTO getRestaurantById(Long id) {
        return restaurantRepository.findByIdWithMenuItems(id)
                .map(RestaurantResponseDTO::new)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
    }

    public List<Restaurant> getRestaurantsByOwner(Long ownerId) {
        return restaurantRepository.findByOwnerIdWithDetails(ownerId);
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

    public String makeSlug(String name, Long ownerId) {
        String base = name == null ? "" : name.toLowerCase()
                                          .replaceAll("[^a-z0-9\\s-]", "")
                                          .trim()
                                          .replaceAll("\\s+", "-");
        if (base.isEmpty()) base = "restaurant";

        String candidate = base;
        int i = 2;
        while (restaurantRepository.existsByOwnerIdAndSlug(ownerId, candidate)) {
            candidate = base + "-" + i++;
        }
        return candidate;
    }

    @Transactional
    public Restaurant createForOwner(Long ownerId, String name, String address, String cityName, String cuisineType, String phone) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Restaurant name is required.");
        }

        Restaurant r = new Restaurant();
        r.setOwner(owner);
        r.setName(name.trim());
        r.setSlug(makeSlug(name, ownerId));
        r.setAddress(address);
        r.setCityName(cityName);
        r.setCuisineType(cuisineType);
        r.setPhone(phone);
        r.setCreatedAt(LocalDateTime.now());
        r.setAverageRating(BigDecimal.ZERO);
        r.setReviewCount(0);
        r.setIsActive(true);

        Restaurant saved = restaurantRepository.save(r);
        try {
            cityService.updateCityRestaurantCounts();
        } catch (Exception e) {
            log.warn("City count update failed after restaurant {} creation", saved.getId(), e);
        }
        return saved;
    }
}
