package com.dineahead.domain;

import com.dineahead.domain.enums.PriceRange;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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
    private PriceRange priceRange;
    private String coverPhotoUrl;
    private String specialOffer;
    private List<String> gallery = new ArrayList<>();
    private BigDecimal averageRating;
    private Integer reviewCount;
    private BigDecimal latitude;
    private BigDecimal longitude;

}