package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteDTO {
    private Long id;
    private Long restaurantId;
    private String name;
    private String coverPhotoUrl;
    private String cuisineType;
    private String priceRange;
    private String address;
    private String city;
    private Double averageRating;
    private Integer reviewCount;
    private String specialOffer;
    private LocalDateTime createdAt;

    public static FavoriteDTO fromEntity(Favorite fav) {
        FavoriteDTO dto = new FavoriteDTO();
        dto.setId(fav.getId());
        dto.setCreatedAt(fav.getCreatedAt());

        Restaurant r = fav.getRestaurant();
        if (r != null) {
            dto.setRestaurantId(r.getId());
            dto.setName(r.getName());
            dto.setCoverPhotoUrl(r.getCoverPhotoUrl());
            dto.setCuisineType(r.getCuisineType());
            dto.setPriceRange(r.getPriceRange());
            dto.setAddress(r.getAddress());
            dto.setCity(r.getCity() != null ? r.getCity().getName() : null);
            dto.setAverageRating(r.getAverageRating() != null ? r.getAverageRating().doubleValue() : 0.0);
            dto.setReviewCount(r.getReviewCount() != null ? r.getReviewCount() : 0);
            dto.setSpecialOffer(r.getSpecialOffer());
        }
        return dto;
    }
}