package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private String address;
    private String city;
    private String cuisineType;
    private String priceRange;
    private String coverPhotoUrl;
    private String specialOffer;
    private List<String> gallery = new ArrayList<>();
    private BigDecimal averageRating;
    private Integer reviewCount;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private List<String> features = new ArrayList<>();
    private List<ReviewDTO> reviews = new ArrayList<>();
    private boolean requiresDeposit;
    private BigDecimal depositAmount;

    public RestaurantResponseDTO(Restaurant restaurant) {
        this.id = restaurant.getId();
        this.name = restaurant.getName();
        this.slug = restaurant.getSlug();
        this.address = restaurant.getAddress();
        this.city = restaurant.getCity();
        this.cuisineType = restaurant.getCuisineType();
        this.priceRange = restaurant.getPriceRange();
        this.coverPhotoUrl = restaurant.getCoverPhotoUrl();
        this.specialOffer = restaurant.getSpecialOffer();
        this.gallery = restaurant.getGallery() != null ? restaurant.getGallery() : new ArrayList<>();
        this.averageRating = restaurant.getAverageRating();
        this.reviewCount = restaurant.getReviewCount();
        this.latitude = restaurant.getLatitude();
        this.longitude = restaurant.getLongitude();

        if (restaurant.getRestaurantFeatures() != null && !restaurant.getRestaurantFeatures().isEmpty()) {
            this.features = restaurant.getRestaurantFeatures().stream()
                    .filter(rf -> rf.getFeature() != null)
                    .map(rf -> rf.getFeature().getName())
                    .collect(Collectors.toList());
        } else {
            this.features = new ArrayList<>();
        }

        if (restaurant.getReviews() != null && !restaurant.getReviews().isEmpty()) {
            this.reviews = restaurant.getReviews().stream()
                    .map(review -> new ReviewDTO(review))
                    .collect(Collectors.toList());
        }

        this.requiresDeposit = restaurant.isRequiresDeposit();
        this.depositAmount = restaurant.getDepositAmount();
    }
}