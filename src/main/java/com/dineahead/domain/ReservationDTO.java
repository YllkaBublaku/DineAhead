package com.dineahead.domain;

import com.dineahead.domain.Reservation;
import com.dineahead.domain.enums.ReservationStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDTO {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private Long userId;
    private String userEmail;
    private LocalDate reservationDate;
    private LocalTime reservationTime;
    private Integer partySize;
    private String specialRequests;
    private ReservationStatus status;
    private Boolean depositPaid;
    private BigDecimal depositAmount;
    private LocalDateTime createdAt;

    public static ReservationDTO fromEntity(Reservation reservation) {
        ReservationDTO dto = new ReservationDTO();
        dto.setId(reservation.getId());

        if (reservation.getRestaurant() != null) {
            dto.setRestaurantId(reservation.getRestaurant().getId());
            dto.setRestaurantName(reservation.getRestaurant().getName());
        }

        if (reservation.getUser() != null) {
            dto.setUserId(reservation.getUser().getId());
            dto.setUserEmail(reservation.getUser().getEmail());
        }

        dto.setReservationDate(reservation.getReservationDate());
        dto.setReservationTime(reservation.getReservationTime());
        dto.setPartySize(reservation.getPartySize());
        dto.setSpecialRequests(reservation.getSpecialRequests());
        dto.setStatus(reservation.getStatus());
        dto.setDepositPaid(reservation.getDepositPaid());
        dto.setDepositAmount(reservation.getDepositAmount());
        dto.setCreatedAt(reservation.getCreatedAt());
        return dto;
    }
}