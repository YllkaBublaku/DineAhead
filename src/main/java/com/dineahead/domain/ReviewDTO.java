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
    }
}