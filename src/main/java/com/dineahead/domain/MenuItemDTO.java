package com.dineahead.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Boolean isAvailable;
    private Boolean isVegetarian;
    private Boolean isVegan;
    private Boolean isGlutenFree;

    public MenuItemDTO(MenuItem menuItem) {
        this.id = menuItem.getId();
        this.name = menuItem.getName();
        this.description = menuItem.getDescription();
        this.price = menuItem.getPrice();
        this.category = menuItem.getCategory();
        this.isAvailable = menuItem.getIsAvailable();
        this.isVegetarian = menuItem.getIsVegetarian();
        this.isVegan = menuItem.getIsVegan();
        this.isGlutenFree = menuItem.getIsGlutenFree();
    }
}