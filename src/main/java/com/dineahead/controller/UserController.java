package com.dineahead.controller;

import com.dineahead.application.FileStorageService;
import com.dineahead.application.UserService;
import com.dineahead.domain.User;
import com.dineahead.domain.UserResponseDTO;
import com.dineahead.domain.UserUpdateDTO;
import com.dineahead.infrastructure.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService,
                          UserRepository userRepository,
                          FileStorageService fileStorageService,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    private UserResponseDTO mapToDTO(User user) {
        return new UserResponseDTO(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(), user.getAvatarUrl(), user.getCreatedAt(), user.getPhone());
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@RequestBody User user) {
        return ResponseEntity.ok(mapToDTO(userService.registerUser(user)));
    }

    @PostMapping("/register/restaurant")
    public ResponseEntity<UserResponseDTO> registerRestaurant(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(mapToDTO(userService.registerRestaurant(payload)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            UserResponseDTO dto = mapToDTO(userService.loginUser(user.getEmail(), user.getPasswordHash()));
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(mapToDTO(userService.getUserById(id)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        userService.requestPasswordReset(email);

        return ResponseEntity.ok(Map.of(
                "message", "If this email exists, a reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully!"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(null);
        }

        try {
            String email = principal.getName();
            User user = userService.getUserByEmail(email);
            return ResponseEntity.ok(mapToDTO(user));
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateDTO dto) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName()  != null) user.setLastName(dto.getLastName());
        if (dto.getEmail()     != null) user.setEmail(dto.getEmail());
        if (dto.getPhone()     != null) user.setPhone(dto.getPhone());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());

        userRepository.save(user);

        return ResponseEntity.ok(new UserResponseDTO(user));
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponseDTO> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String url = fileStorageService.saveAvatar(file, id);
        user.setAvatarUrl(url);
        userRepository.save(user);

        return ResponseEntity.ok(mapToDTO(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Password confirmation required"));
        }

        try {
            userService.deleteUser(id, password);
            return ResponseEntity.ok(Map.of("message", "Account deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/dev/hash")
    public ResponseEntity<Map<String, String>> devHash(@RequestParam String raw) {
        return ResponseEntity.ok(Map.of("hash", passwordEncoder.encode(raw)));
    }
}