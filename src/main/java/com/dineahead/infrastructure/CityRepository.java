package com.dineahead.infrastructure;

import com.dineahead.domain.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    @Query("SELECT c FROM City c ORDER BY c.restaurantCount DESC")
    List<City> findAllOrderByRestaurantCountDesc();

    List<City> findByCountry(String country);
}