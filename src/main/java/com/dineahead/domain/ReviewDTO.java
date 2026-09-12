package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Long id;
    private String userName;
    private Integer rating;
    private Integer foodRating;
    private Integer serviceRating;
    private Integer ambianceRating;
    private String comment;
    private LocalDateTime createdAt;
    private Integer helpfulCount;
    private Long restaurantId;
    private String restaurantName;
    private String ownerResponse;
    private LocalDateTime ownerRespondedAt;

    public ReviewDTO(Review review) {
        this.id = review.getId();

        if (review.getUser() != null) {
            String firstName = review.getUser().getFirstName() != null ? review.getUser().getFirstName() : "";
            String lastName = review.getUser().getLastName() != null ? review.getUser().getLastName() : "";
            this.userName = (firstName + " " + lastName).trim();
            if (this.userName.isEmpty()) {
                this.userName = "Anonymous";
            }
        } else {
            this.userName = "Anonymous";
        }

        this.rating = review.getRating();
        this.foodRating = review.getFoodRating();
        this.serviceRating = review.getServiceRating();
        this.ambianceRating = review.getAmbianceRating();
        this.comment = review.getComment();
        this.createdAt = review.getCreatedAt();
        this.helpfulCount = review.getHelpfulCount() != null ? review.getHelpfulCount() : 0;

        if (review.getRestaurant() != null) {
            this.restaurantId = review.getRestaurant().getId();
            this.restaurantName = review.getRestaurant().getName();
        }

        this.ownerResponse = review.getOwnerResponse();
        this.ownerRespondedAt = review.getOwnerRespondedAt();
    }
}