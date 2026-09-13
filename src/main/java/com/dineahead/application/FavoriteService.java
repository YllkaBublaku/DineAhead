package com.dineahead.application;

import com.dineahead.domain.Favorite;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.User;
import com.dineahead.infrastructure.FavoriteRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           UserRepository userRepository,
                           RestaurantRepository restaurantRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional
    public Favorite addFavorite(Long userId, Long restaurantId) {
        if (favoriteRepository.findByUserIdAndRestaurantId(userId, restaurantId).isPresent()) {
            throw new RuntimeException("Already a favorite!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + restaurantId));

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setRestaurant(restaurant);
        favorite.setCreatedAt(LocalDateTime.now());

        return favoriteRepository.save(favorite);
    }

    @Transactional(readOnly = true)
    public List<Favorite> getFavoritesByUser(Long userId) {
        return favoriteRepository.findByUserId(userId);
    }

    @Transactional
    public void removeFavorite(Long userId, Long restaurantId) {
        favoriteRepository.deleteByUserIdAndRestaurantId(userId, restaurantId);
    }
}