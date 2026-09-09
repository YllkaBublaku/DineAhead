package com.dineahead.application;

import com.dineahead.domain.City;
import com.dineahead.infrastructure.CityRepository;
import com.dineahead.infrastructure.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CityService {

    private final CityRepository cityRepository;
    private final RestaurantRepository restaurantRepository;

    public CityService(CityRepository cityRepository, RestaurantRepository restaurantRepository) {
        this.cityRepository = cityRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional(readOnly = true)
    public List<City> getAllCities() {
        updateCityRestaurantCounts();
        return cityRepository.findAllOrderByRestaurantCountDesc();
    }

    @Transactional
    public void updateCityRestaurantCounts() {
        List<City> cities = cityRepository.findAll();
        cities.forEach(city -> {
            long count = restaurantRepository.countByCity(city);
            city.setRestaurantCount((int) count);
            cityRepository.save(city);
        });
    }
}