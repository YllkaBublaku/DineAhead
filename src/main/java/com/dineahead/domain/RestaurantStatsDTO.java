package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantStatsDTO {
    private long todayBookings;
    private long upcoming;
    private String noShowRate;
    private BigDecimal revenue;
    private List<BigDecimal> weekRevenue;
}