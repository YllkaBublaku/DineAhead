package com.dineahead.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads");

    @Value("${app.public-base-url}")
    private String publicBaseUrl;

    public FileStorageService() {
        try {
            Files.createDirectories(root.resolve("avatars"));
            Files.createDirectories(root.resolve("covers"));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories", e);
        }
    }

    public String saveAvatar(MultipartFile file, Long userId) {
        return save(file, "avatars", "user-" + userId + "-" + UUID.randomUUID());
    }

    public String saveCoverPhoto(MultipartFile file, Long restaurantId) {
        return save(file, "covers", "restaurant-" + restaurantId + "-" + UUID.randomUUID());
    }

    private String save(MultipartFile file, String subfolder, String baseName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        String ext = extensionFor(contentType);
        String filename = baseName + ext;
        Path target = root.resolve(subfolder).resolve(filename);

        try {
            file.transferTo(target.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        return publicBaseUrl + "/uploads/" + subfolder + "/" + filename;
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png"  -> ".png";
            case "image/jpeg",
                 "image/jpg"  -> ".jpg";
            case "image/gif"  -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".bin";
        };
    }
}