package com.dineahead.domain;

import com.dineahead.domain.enums.PriceRange;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = true)
    private String address;

    @Column(nullable = true)
    private String city;

    private String state;
    private String zip;

    @Column(name = "cuisine_type")
    private String cuisineType;

    @Column(name = "price_range", length = 50)
    private String priceRange;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_photo_url")
    private String coverPhotoUrl;

    @Column(name = "special_offer")
    private String specialOffer;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @JsonIgnore
    @ElementCollection
    @CollectionTable(name = "restaurant_gallery", joinColumns = @JoinColumn(name = "restaurant_id"))
    @Column(name = "image_url")
    private List<String> gallery = new ArrayList<>();

    @Column(name = "average_rating")
    private BigDecimal averageRating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantImage> images = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantHours> hours = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantOverride> overrides = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private RestaurantDepositSettings depositSettings;

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantTable> tables = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TimeSlot> timeSlots = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reservation> reservations = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Favorite> favorites = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantFeature> restaurantFeatures = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuItem> menuItems = new ArrayList<>();

    @Transient
    public boolean isRequiresDeposit() {
        return depositSettings != null && depositSettings.isRequiresDeposit();
    }

    @Transient
    public BigDecimal getDepositAmount() {
        return depositSettings != null ? depositSettings.getDepositAmount() : BigDecimal.ZERO;
    }

    @Transient
    public List<String> getFeatureNames() {
        if (restaurantFeatures == null || restaurantFeatures.isEmpty()) {
            return new ArrayList<>();
        }
        return restaurantFeatures.stream()
                .filter(rf -> rf.getFeature() != null)
                .map(rf -> rf.getFeature().getName())
                .collect(Collectors.toList());
    }
}
