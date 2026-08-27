package com.dineahead.infrastructure;

import com.dineahead.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByRestaurantId(Long restaurantId);
    List<Reservation> findByRestaurantIdAndReservationDate(Long restaurantId, LocalDate reservationDate);
    boolean existsByRestaurantIdAndUserIdAndReservationDate(Long restaurantId, Long userId, LocalDate reservationDate);
}
