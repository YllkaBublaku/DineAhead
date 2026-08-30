package com.dineahead.infrastructure;

import com.dineahead.domain.RestaurantFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RestaurantFeatureRepository extends JpaRepository<RestaurantFeature, Long> {
}
