package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantImage;
import com.dineahead.infrastructure.RestaurantImageRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantImageService {
    private final RestaurantImageRepository restaurantImageRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantImageService(RestaurantImageRepository restaurantImageRepository, RestaurantRepository restaurantRepository) {
        this.restaurantImageRepository = restaurantImageRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantImage addImage(Long restaurantId, RestaurantImage image) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        image.setRestaurant(restaurant);
        return restaurantImageRepository.save(image);
    }

    public List<RestaurantImage> getImagesByRestaurant(Long restaurantId) {
        return restaurantImageRepository.findByRestaurantId(restaurantId);
    }
}
