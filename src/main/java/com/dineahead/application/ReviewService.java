package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.Review;
import com.dineahead.domain.ReviewDTO;
import com.dineahead.domain.ReviewHelpful;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.ReviewHelpfulRepository;
import com.dineahead.infrastructure.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReviewHelpfulRepository reviewHelpfulRepository;

    public ReviewService(ReviewRepository reviewRepository, RestaurantRepository restaurantRepository, ReviewHelpfulRepository reviewHelpfulRepository) {
        this.reviewRepository = reviewRepository;
        this.restaurantRepository = restaurantRepository;
        this.reviewHelpfulRepository = reviewHelpfulRepository;
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

    @Transactional
    public Map<String, Object> toggleHelpful(Long reviewId, Long userId) {
        Map<String, Object> response = new HashMap<>();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        if (review.getHelpfulCount() == null) {
            review.setHelpfulCount(0);
        }

        boolean isHelpful = reviewHelpfulRepository.existsByReviewIdAndUserId(reviewId, userId);

        if (isHelpful) {
            reviewHelpfulRepository.deleteByReviewIdAndUserId(reviewId, userId);
            review.setHelpfulCount(review.getHelpfulCount() - 1);
            response.put("helpful", false);
        } else {
            ReviewHelpful helpful = new ReviewHelpful();
            helpful.setReview(review);
            helpful.setUserId(userId);
            reviewHelpfulRepository.save(helpful);
            review.setHelpfulCount(review.getHelpfulCount() + 1);
            response.put("helpful", true);
        }

        reviewRepository.save(review);
        response.put("reviewId", reviewId);
        response.put("helpfulCount", review.getHelpfulCount());

        return response;
    }

    public Map<String, Object> getHelpfulStatus(Long reviewId, Long userId) {
        Map<String, Object> response = new HashMap<>();

        if (userId == null) {
            response.put("helpful", false);
            response.put("reviewId", reviewId);
            return response;
        }

        boolean isHelpful = reviewHelpfulRepository.existsByReviewIdAndUserId(reviewId, userId);
        response.put("helpful", isHelpful);
        response.put("reviewId", reviewId);

        Review review = reviewRepository.findById(reviewId).orElse(null);
        if (review != null && review.getHelpfulCount() != null) {
            response.put("helpfulCount", review.getHelpfulCount());
        }

        return response;
    }

    @Transactional
    public ReviewDTO respondToReview(Long reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));

        review.setOwnerResponse(response);
        review.setOwnerRespondedAt(LocalDateTime.now());
        reviewRepository.save(review);

        return toDto(review);
    }

    private ReviewDTO toDto(Review r) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(r.getId());
        if (r.getUser() != null) {
            dto.setUserName((r.getUser().getFirstName() + " " + r.getUser().getLastName()).trim());
        }
        dto.setRating(r.getRating());
        dto.setFoodRating(r.getFoodRating());
        dto.setServiceRating(r.getServiceRating());
        dto.setAmbianceRating(r.getAmbianceRating());
        dto.setComment(r.getComment());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setHelpfulCount(r.getHelpfulCount());
        dto.setOwnerResponse(r.getOwnerResponse());
        dto.setOwnerRespondedAt(r.getOwnerRespondedAt());
        return dto;
    }
}