package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.TimeSlot;
import com.dineahead.infrastructure.RestaurantRepository;
import com.dineahead.infrastructure.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimeSlotService {
    private final TimeSlotRepository timeSlotRepository;
    private final RestaurantRepository restaurantRepository;

    public TimeSlotService(TimeSlotRepository timeSlotRepository, RestaurantRepository restaurantRepository) {
        this.timeSlotRepository = timeSlotRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public TimeSlot addTimeSlot(Long restaurantId, TimeSlot timeSlot) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow(() -> new RuntimeException("Restaurant not found"));
        timeSlot.setRestaurant(restaurant);
        return timeSlotRepository.save(timeSlot);
    }

    public List<TimeSlot> getActiveTimeSlots(Long restaurantId) {
        return timeSlotRepository.findByRestaurantIdAndIsActiveTrue(restaurantId);
    }
}
