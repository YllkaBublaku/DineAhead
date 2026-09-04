package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDTO {
    private Long id;
    private String slotTime;
    private String slotDate;
    private Integer maxCapacity;
    private Boolean isActive;

    public TimeSlotDTO(TimeSlot timeSlot) {
        this.id = timeSlot.getId();
        this.slotTime = timeSlot.getSlotTime() != null ? timeSlot.getSlotTime().toString() : null;
        this.slotDate = timeSlot.getSlotDate() != null ? timeSlot.getSlotDate().toString() : null;
        this.maxCapacity = timeSlot.getMaxCapacity();
        this.isActive = timeSlot.isActive();
    }
}