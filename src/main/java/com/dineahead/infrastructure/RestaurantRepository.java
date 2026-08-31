package com.dineahead.infrastructure;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.User;
import com.dineahead.domain.enums.PriceRange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findBySlug(String slug);
    List<Restaurant> findByCity(String city);
    List<Restaurant> findByOwnerId(Long ownerId);
    Long owner(User owner);

    Page<Restaurant> findByCity(String city, Pageable pageable);

    @Query("SELECT r FROM Restaurant r WHERE " +
            "(:city IS NULL OR r.city = :city) AND " +
            "(:query IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:cuisine IS NULL OR r.cuisineType = :cuisine) AND " +
            "(:price IS NULL OR r.priceRange = :price) AND " +
            "(:specialOffers IS NULL OR :specialOffers = false OR r.specialOffer IS NOT NULL)")
    Page<Restaurant> searchRestaurants(@Param("city") String city,
                                       @Param("query") String query,
                                       @Param("cuisine") String cuisine,
                                       @Param("price") PriceRange price,
                                       @Param("specialOffers") boolean specialOffers,
                                       Pageable pageable);

    @Query("SELECT DISTINCT r FROM Restaurant r " +
            "LEFT JOIN FETCH r.restaurantFeatures rf " +
            "LEFT JOIN FETCH rf.feature f")
    List<Restaurant> findAllWithFeatures();

    @Query("SELECT DISTINCT r FROM Restaurant r " +
            "LEFT JOIN FETCH r.restaurantFeatures rf " +
            "LEFT JOIN FETCH rf.feature f " +
            "WHERE r.id = :id")
    Optional<Restaurant> findByIdWithFeatures(@Param("id") Long id);

    @Query("SELECT DISTINCT r FROM Restaurant r " +
            "LEFT JOIN FETCH r.restaurantFeatures rf " +
            "LEFT JOIN FETCH rf.feature f " +
            "LEFT JOIN FETCH r.depositSettings ds " +
            "WHERE r.id = :id")
    Optional<Restaurant> findByIdWithFeaturesAndDeposit(@Param("id") Long id);
}
