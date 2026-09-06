package com.dineahead.domain;

import java.math.BigDecimal;

public class DepositSettingsResponseDTO {
    private Long restaurantId;
    private boolean requiresDeposit;
    private BigDecimal amount;

    public DepositSettingsResponseDTO() {}

    public DepositSettingsResponseDTO(Long restaurantId, boolean requiresDeposit, BigDecimal amount) {
        this.restaurantId = restaurantId;
        this.requiresDeposit = requiresDeposit;
        this.amount = amount;
    }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public boolean isRequiresDeposit() { return requiresDeposit; }
    public void setRequiresDeposit(boolean requiresDeposit) { this.requiresDeposit = requiresDeposit; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}