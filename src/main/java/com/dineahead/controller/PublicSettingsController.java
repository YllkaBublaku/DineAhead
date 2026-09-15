package com.dineahead.controller;

import com.dineahead.domain.PlatformSetting;
import com.dineahead.infrastructure.PlatformSettingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class PublicSettingsController {

    private final PlatformSettingRepository platformSettingRepository;

    public PublicSettingsController(PlatformSettingRepository platformSettingRepository) {
        this.platformSettingRepository = platformSettingRepository;
    }

    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicSettings() {
        Map<String, String> result = new HashMap<>();
        for (PlatformSetting s : platformSettingRepository.findAll()) {
            result.put(s.getKey(), s.getValue() != null ? s.getValue() : "");
        }
        return ResponseEntity.ok(result);
    }
}