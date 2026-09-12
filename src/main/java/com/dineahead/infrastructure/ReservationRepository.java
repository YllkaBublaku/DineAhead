package com.dineahead.infrastructure;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByRestaurantId(Long restaurantId);
    List<Reservation> findByRestaurantIdAndReservationDate(Long restaurantId, LocalDate reservationDate);
    boolean existsByRestaurantIdAndUserIdAndReservationDate(Long restaurantId, Long userId, LocalDate reservationDate);

    @Query("SELECT COUNT(r) FROM Reservation r " +
            "WHERE r.restaurant.id = :restaurantId " +
            "AND r.reservationDate = :date")
    long countByRestaurantAndDate(@Param("restaurantId") Long restaurantId,
                                  @Param("date") LocalDate date);

    @Query("SELECT COUNT(r) FROM Reservation r " +
            "WHERE r.restaurant.id = :restaurantId " +
            "AND r.reservationDate >= :from " +
            "AND r.status <> com.dineahead.domain.enums.ReservationStatus.CANCELLED")
    long countUpcoming(@Param("restaurantId") Long restaurantId,
                       @Param("from") LocalDate from);

    @Query("SELECT COUNT(r) FROM Reservation r " +
            "WHERE r.restaurant.id = :restaurantId " +
            "AND r.status = :status")
    long countByRestaurantAndStatus(@Param("restaurantId") Long restaurantId,
                                    @Param("status") ReservationStatus status);

    @Query("SELECT COALESCE(SUM(r.depositAmount), 0) FROM Reservation r " +
            "WHERE r.restaurant.id = :restaurantId " +
            "AND r.reservationDate = :date " +
            "AND r.depositPaid = true")
    BigDecimal sumRevenueForDate(@Param("restaurantId") Long restaurantId,
                                 @Param("date") LocalDate date);

    @Query("SELECT r FROM Reservation r " +
            "WHERE r.restaurant.id = :restaurantId " +
            "AND r.reservationDate BETWEEN :from AND :to " +
            "AND r.status <> com.dineahead.domain.enums.ReservationStatus.CANCELLED")
    List<Reservation> findBetweenDates(@Param("restaurantId") Long restaurantId,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);

}
