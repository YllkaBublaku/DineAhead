package com.dineahead.controller;

import com.dineahead.application.ReviewService;
import com.dineahead.domain.Review;
import com.dineahead.domain.ReviewDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.createReview(review));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getReviewsByRestaurant(restaurantId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @PostMapping("/{reviewId}/helpful")
    public ResponseEntity<?> toggleHelpful(
            @PathVariable Long reviewId,
            @RequestParam(required = false) Long userId) {
        try {
            Map<String, Object> result = reviewService.toggleHelpful(reviewId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{reviewId}/helpful-status")
    public ResponseEntity<?> getHelpfulStatus(
            @PathVariable Long reviewId,
            @RequestParam(required = false) Long userId) {
        try {
            Map<String, Object> result = reviewService.getHelpfulStatus(reviewId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }
}