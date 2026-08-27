package com.dineahead.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "restaurant_deposit_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantDepositSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false, unique = true)
    private Restaurant restaurant;

    @Column(name = "requires_deposit")
    private boolean requiresDeposit;

    @Column(name = "deposit_amount")
    private BigDecimal depositAmount;

    @Column(name = "min_party_size_for_deposit")
    private Integer minPartySizeForDeposit;
}
