package com.dineahead.application;

import com.dineahead.domain.Favorite;
import com.dineahead.infrastructure.FavoriteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    public Favorite addFavorite(Long userId, Long restaurantId) {
        if (favoriteRepository.findByUserIdAndRestaurantId(userId, restaurantId).isPresent()) {
            throw new RuntimeException("Already a favorite!");
        }
        Favorite favorite = new Favorite();
        favorite.setCreatedAt(LocalDateTime.now());
        return favoriteRepository.save(favorite);
    }

    public List<Favorite> getFavoritesByUser(Long userId) {
        return favoriteRepository.findByUserId(userId);
    }

    public void removeFavorite(Long userId, Long restaurantId) {
        favoriteRepository.deleteByUserIdAndRestaurantId(userId, restaurantId);
    }
}
