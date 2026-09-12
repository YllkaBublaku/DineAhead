package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDTO {
    private Long restaurantId;
    private String date;
    private Integer partySize;
    private boolean open;
    private String reason;
    private List<String> slots;
    private List<SlotInfo> detailedSlots;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotInfo {
        private String time;
        private boolean available;
        private String reason;
    }
}