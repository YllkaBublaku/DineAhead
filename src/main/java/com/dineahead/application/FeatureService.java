package com.dineahead.application;

import com.dineahead.domain.Feature;
import com.dineahead.infrastructure.FeatureRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeatureService {
    private final FeatureRepository featureRepository;

    public FeatureService(FeatureRepository featureRepository) {
        this.featureRepository = featureRepository;
    }

    public List<Feature> getAllFeatures() {
        return featureRepository.findAll();
    }

    public List<String> getAllFeatureNames() {
        return featureRepository.findByIsActiveTrue()
                .stream()
                .map(Feature::getName)
                .collect(Collectors.toList());
    }

    public Feature createFeature(Feature feature) {
        return featureRepository.save(feature);
    }
}