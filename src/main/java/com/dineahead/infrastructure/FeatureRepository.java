package com.dineahead.infrastructure;

import com.dineahead.domain.Feature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, Long> {
    List<Feature> findByIsActiveTrue();

    Optional<Feature> findByName(String name);
}

