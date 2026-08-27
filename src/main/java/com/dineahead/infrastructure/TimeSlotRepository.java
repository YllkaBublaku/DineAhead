package com.dineahead.infrastructure;

import com.dineahead.domain.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByRestaurantId(Long restaurantId);
    List<TimeSlot> findByRestaurantIdAndIsActiveTrue(Long restaurantId);
}
