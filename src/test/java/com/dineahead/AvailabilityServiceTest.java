package com.dineahead;

import com.dineahead.application.AvailabilityService;
import com.dineahead.domain.AvailabilityDTO;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantHours;
import com.dineahead.domain.RestaurantTable;
import com.dineahead.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AvailabilityServiceTest {

    @Mock private RestaurantRepository restaurantRepository;
    @Mock private RestaurantHoursRepository hoursRepository;
    @Mock private RestaurantOverrideRepository overrideRepository;
    @Mock private RestaurantTableRepository tableRepository;
    @Mock private ReservationRepository reservationRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private Restaurant testRestaurant;

    @BeforeEach
    void setUp() {
        testRestaurant = new Restaurant();
        testRestaurant.setId(1L);
    }

    @Test
    void testGetAvailability_WhenClosed_ReturnsNotOpen() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));
        when(overrideRepository.findByRestaurantIdAndOverrideDate(any(), any())).thenReturn(Collections.emptyList());

        RestaurantHours closedHours = new RestaurantHours();
        closedHours.setClosed(true);
        when(hoursRepository.findByRestaurantIdAndDayOfWeek(any(), any())).thenReturn(List.of(closedHours));

        AvailabilityDTO result = availabilityService.getAvailability(1L, LocalDate.now(), 2);

        assertFalse(result.isOpen());
        assertEquals("Closed", result.getReason());
    }

    @Test
    void testGetAvailability_WhenNoTableFitsPartySize_ReturnsEmptySlots() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));

        RestaurantHours openHours = new RestaurantHours();
        openHours.setClosed(false);
        openHours.setOpeningTime(LocalTime.of(10, 0));
        openHours.setClosingTime(LocalTime.of(22, 0));
        when(hoursRepository.findByRestaurantIdAndDayOfWeek(any(), any())).thenReturn(List.of(openHours));

        RestaurantTable table = new RestaurantTable();
        table.setMinCapacity(1);
        table.setMaxCapacity(2);
        when(tableRepository.findByRestaurantId(1L)).thenReturn(List.of(table));

        AvailabilityDTO result = availabilityService.getAvailability(1L, LocalDate.now(), 4);

        assertTrue(result.isOpen());
        assertTrue(result.getSlots().isEmpty());
        assertTrue(result.getReason().contains("No table fits"));
    }
}