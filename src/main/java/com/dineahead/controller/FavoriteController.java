package com.dineahead.controller;

import com.dineahead.application.FavoriteService;
import com.dineahead.domain.Favorite;
import com.dineahead.domain.FavoriteDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{userId}/{restaurantId}")
    @Transactional
    public ResponseEntity<FavoriteDTO> addFavorite(
            @PathVariable Long userId,
            @PathVariable Long restaurantId) {
        Favorite fav = favoriteService.addFavorite(userId, restaurantId);
        return ResponseEntity.ok(FavoriteDTO.fromEntity(fav));
    }

    @GetMapping("/user/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<FavoriteDTO>> getFavorites(@PathVariable Long userId) {
        List<Favorite> favorites = favoriteService.getFavoritesByUser(userId);
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

        List<FavoriteDTO> list = favorites.stream()
                .map(FavoriteDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{userId}/{restaurantId}")
    @Transactional
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long userId,
            @PathVariable Long restaurantId) {
        favoriteService.removeFavorite(userId, restaurantId);
        return ResponseEntity.noContent().build();
    }
}