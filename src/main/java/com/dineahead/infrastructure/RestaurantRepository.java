package com.dineahead.infrastructure;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findBySlug(String slug);
    List<Restaurant> findByCity(String city);
    List<Restaurant> findByOwnerId(Long ownerId);

    Long owner(User owner);
}
