package com.dineahead.config;

import java.util.HashMap;
import java.util.Map;

public class ImageConfig {

    private static final Map<String, String> CITY_IMAGES = new HashMap<>();
    private static final Map<String, String> CUISINE_IMAGES = new HashMap<>();

    static {
        CITY_IMAGES.put("Paris", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Amsterdam", "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Barcelona", "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Lisbon", "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Madrid", "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Milan", "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Rome", "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("London", "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Berlin", "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Vienna", "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Prague", "https://images.unsplash.com/photo-1541845157-a6d2d100c931?auto=format&fit=crop&w=400&h=300&q=80");
        CITY_IMAGES.put("Budapest", "https://images.unsplash.com/photo-1559827291-72b739e2d3e4?auto=format&fit=crop&w=400&h=300&q=80");

        CUISINE_IMAGES.put("European", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("French", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Asian", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Italian", "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Traditional", "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Japanese", "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Mediterranean", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Indian", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Turkish", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Chinese", "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Mexican", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&h=400&q=80");
        CUISINE_IMAGES.put("Thai", "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=400&h=400&q=80");
    }

    public static String getCityImage(String cityName) {
        return CITY_IMAGES.getOrDefault(cityName, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&h=300&q=80");
    }

    public static String getCuisineImage(String cuisineName) {
        return CUISINE_IMAGES.getOrDefault(cuisineName, "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&h=400&q=80");
    }
}