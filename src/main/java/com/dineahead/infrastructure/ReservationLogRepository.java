package com.dineahead.infrastructure;

import com.dineahead.domain.ReservationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationLogRepository extends JpaRepository<ReservationLog, Long> {
    List<ReservationLog> findByReservationId(Long reservationId);
    List<ReservationLog> findByChangedById(Long userId);
}
