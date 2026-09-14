package com.dineahead.controller;

import com.dineahead.application.RestaurantImageService;
import com.dineahead.domain.*;
import com.dineahead.domain.enums.Role;
import com.dineahead.infrastructure.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final CityRepository cityRepository;
    private final RestaurantImageService restaurantImageService;

    public AdminController(UserRepository userRepository,
                           RestaurantRepository restaurantRepository,
                           ReservationRepository reservationRepository,
                           ReviewRepository reviewRepository,
                           CityRepository cityRepository,
                           RestaurantImageService restaurantImageService) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.reservationRepository = reservationRepository;
        this.reviewRepository = reviewRepository;
        this.cityRepository = cityRepository;
        this.restaurantImageService = restaurantImageService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalRestaurants = restaurantRepository.count();
        long activeRestaurants = restaurantRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .count();
        long totalUsers = userRepository.count();
        long reservationsToday = reservationRepository.findAll().stream()
                .filter(r -> LocalDate.now().equals(r.getReservationDate()))
                .count();
        long totalReviews = reviewRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("restaurants", totalRestaurants);
        stats.put("activeRestaurants", activeRestaurants);
        stats.put("users", totalUsers);
        stats.put("reservationsToday", reservationsToday);
        stats.put("reviews", totalReviews);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/restaurants")
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAllWithOwnerAndCity();

        restaurants.forEach(r -> {
            if (r.getCity() != null && r.getCity().getName() != null && !r.getCity().getName().isEmpty()) {
                r.setCityImageUrl(r.getCity().getImageUrl());
            }
            if (r.getCuisineType() != null && !r.getCuisineType().isEmpty()) {
                r.setCuisineImageUrl(com.dineahead.config.ImageConfig.getCuisineImage(r.getCuisineType()));
            }
        });

        return ResponseEntity.ok(
                restaurants.stream()
                        .map(RestaurantResponseDTO::new)
                        .collect(Collectors.toList())
        );
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<?> adminDeleteRestaurant(@PathVariable Long id) {
        if (!restaurantRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        restaurantRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Restaurant deleted"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .map(UserResponseDTO::new)
                        .collect(Collectors.toList())
        );
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role;
        try {
            role = Role.valueOf(body.get("role").toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        u.setRole(role);
        userRepository.save(u);
        return ResponseEntity.ok(new UserResponseDTO(u));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> adminDeleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        return ResponseEntity.ok(
                reservationRepository.findAll().stream()
                        .map(ReservationDTO::fromEntity)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewDTO>> getAllReviews() {
        return ResponseEntity.ok(
                reviewRepository.findAll().stream()
                        .map(ReviewDTO::new)
                        .collect(Collectors.toList())
        );
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted"));
    }

    @PostMapping("/cities")
    public ResponseEntity<City> createCity(@RequestBody City city) {
        return ResponseEntity.ok(cityRepository.save(city));
    }

    @PutMapping("/cities/{id}")
    public ResponseEntity<City> updateCity(@PathVariable Long id, @RequestBody City update) {
        City c = cityRepository.findById(id).orElseThrow();
        c.setName(update.getName());
        c.setImageUrl(update.getImageUrl());
        c.setCountry(update.getCountry());
        return ResponseEntity.ok(cityRepository.save(c));
    }

    @DeleteMapping("/cities/{id}")
    public ResponseEntity<?> deleteCity(@PathVariable Long id) {
        cityRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "City deleted"));
    }
}