package com.dineahead.infrastructure;

import com.dineahead.domain.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.restaurant.id = :restaurantId AND ts.isActive = true")
    List<TimeSlot> findByRestaurantIdAndIsActiveTrue(@Param("restaurantId") Long restaurantId);

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.restaurant.id = :restaurantId AND ts.isActive = true AND ts.slotDate = :date")
    List<TimeSlot> findByRestaurantIdAndDateAndIsActiveTrue(@Param("restaurantId") Long restaurantId, @Param("date") LocalDate date);

    List<TimeSlot> findByRestaurantId(Long restaurantId);
}