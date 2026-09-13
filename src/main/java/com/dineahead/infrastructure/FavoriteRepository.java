package com.dineahead.infrastructure;

import com.dineahead.domain.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserId(Long userId);

    Optional<Favorite> findByUserIdAndRestaurantId(Long userId, Long restaurantId);

    @Modifying
    @Transactional
    void deleteByUserIdAndRestaurantId(Long userId, Long restaurantId);
}