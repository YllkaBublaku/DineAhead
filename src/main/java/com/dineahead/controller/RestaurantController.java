package com.dineahead.controller;

import com.dineahead.application.*;
import com.dineahead.domain.*;
import com.dineahead.domain.enums.ReservationStatus;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;

    public RestaurantController(RestaurantService restaurantService, FeatureService featureService, ReviewService reviewService, RestaurantImageService restaurantImageService, AvailabilityService availabilityService, FileStorageService fileStorageService, RestaurantRepository restaurantRepository, PasswordEncoder passwordEncoder) {
        this.restaurantService = restaurantService;
        this.featureService = featureService;
        this.reviewService = reviewService;
        this.restaurantImageService = restaurantImageService;
        this.availabilityService = availabilityService;
        this.fileStorageService = fileStorageService;
        this.restaurantRepository = restaurantRepository;
        this.passwordEncoder = passwordEncoder;;
    }

    private RestaurantResponseDTO mapToDTO(Restaurant restaurant) {
        return new RestaurantResponseDTO(restaurant);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantImageService.getAllRestaurantsWithImages();

        restaurants = restaurants.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .collect(Collectors.toList());

        List<RestaurantResponseDTO> dtos = restaurants.stream()
                .map(RestaurantResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<RestaurantResponseDTO>> getRestaurantsByCity(@PathVariable String city) {
        List<Restaurant> restaurants = restaurantService.getRestaurantsByCity(city);

        restaurants = restaurants.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .collect(Collectors.toList());

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

    @PostMapping(value = "/{id}/cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RestaurantResponseDTO> uploadCoverPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        String url = fileStorageService.saveCoverPhoto(file, id);
        restaurant.setCoverPhotoUrl(url);
        restaurantRepository.save(restaurant);

        return ResponseEntity.ok(new RestaurantResponseDTO(restaurant));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<RestaurantResponseDTO> deactivateRestaurant(@PathVariable Long id) {
        restaurantService.deactivateRestaurant(id);
        Restaurant r = restaurantRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(new RestaurantResponseDTO(r));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<RestaurantResponseDTO> activateRestaurant(@PathVariable Long id) {
        restaurantService.activateRestaurant(id);
        Restaurant r = restaurantRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(new RestaurantResponseDTO(r));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRestaurant(@PathVariable Long id,
                                              @RequestBody(required = false) Map<String, String> body) {
        try {
            String password = body != null ? body.get("password") : null;
            restaurantService.deleteRestaurant(id, password, passwordEncoder);
            return ResponseEntity.ok(Map.of("message", "Restaurant deleted"));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Could not delete: " + e.getMessage()));
        }
    }
}