package com.dineahead.application;

import com.dineahead.domain.Favorite;
import com.dineahead.domain.FavoriteDTO;
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
    public FavoriteDTO addFavorite(Long userId, Long restaurantId) {
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

        Favorite saved = favoriteRepository.save(favorite);

        return FavoriteDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<FavoriteDTO> getFavoritesByUser(Long userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);

        favorites.forEach(f -> {
            if (f.getRestaurant() != null) {
                f.getRestaurant().getName();
                f.getRestaurant().getCoverPhotoUrl();
                f.getRestaurant().getCuisineType();
                f.getRestaurant().getPriceRange();
                f.getRestaurant().getAddress();
                f.getRestaurant().getSpecialOffer();
                if (f.getRestaurant().getCity() != null) {
                    f.getRestaurant().getCity().getName();
                }
            }
        });

        return favorites.stream()
                .map(FavoriteDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    public void removeFavorite(Long userId, Long restaurantId) {
        favoriteRepository.deleteByUserIdAndRestaurantId(userId, restaurantId);
    }
}
