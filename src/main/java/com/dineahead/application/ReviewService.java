package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.Review;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.ReviewRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;

    public ReviewService(ReviewRepository reviewRepository, RestaurantRepository restaurantRepository) {
            this.reviewRepository = reviewRepository;
            this.restaurantRepository = restaurantRepository;
        }

        @Transactional
        public Review createReview(Review review) {
            review.setCreatedAt(LocalDateTime.now());
            Review savedReview = reviewRepository.save(review);

            Restaurant restaurant = restaurantRepository.findById(review.getRestaurant().getId())
                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));

            Double avgRating = reviewRepository.findAverageRatingByRestaurantId(restaurant.getId());
            int totalReviews = reviewRepository.findByRestaurantId(restaurant.getId()).size();

            restaurant.setAverageRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            restaurant.setReviewCount(totalReviews);

            restaurantRepository.save(restaurant);

            return savedReview;
        }

    public List<Review> getReviewsByRestaurant(Long restaurantId) {
        return reviewRepository.findByRestaurantId(restaurantId);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserId(userId);
    }
}