package com.dineahead.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "restaurant_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_cover")
    private boolean isCover;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
