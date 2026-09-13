package com.dineahead.controller;

import com.dineahead.application.FavoriteService;
import com.dineahead.domain.Favorite;
import com.dineahead.domain.FavoriteDTO;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<FavoriteDTO> addFavorite(
            @PathVariable Long userId,
            @PathVariable Long restaurantId) {
        return ResponseEntity.ok(favoriteService.addFavorite(userId, restaurantId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FavoriteDTO>> getFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(favoriteService.getFavoritesByUser(userId));
    }

    @DeleteMapping("/{userId}/{restaurantId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long userId,
            @PathVariable Long restaurantId) {
        favoriteService.removeFavorite(userId, restaurantId);
        return ResponseEntity.noContent().build();
    }
}