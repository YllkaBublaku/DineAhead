package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.Review;
import com.dineahead.domain.ReviewDTO;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByRestaurant(Long restaurantId) {
        List<Review> reviews = reviewRepository.findByRestaurantId(restaurantId);
        return reviews.stream()
                .map(review -> new ReviewDTO(review))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByUser(Long userId) {
        List<Review> reviews = reviewRepository.findByUserId(userId);
        return reviews.stream()
                .map(review -> new ReviewDTO(review))
                .collect(Collectors.toList());
    }
}