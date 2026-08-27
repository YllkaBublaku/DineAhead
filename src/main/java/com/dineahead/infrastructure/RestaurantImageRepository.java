package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantImageRepository extends JpaRepository<RestaurantImage, Long> {
    List<RestaurantImage> findByRestaurantId(Long restaurantId);
}
