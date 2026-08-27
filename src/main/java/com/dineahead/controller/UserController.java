package com.dineahead.controller;

import com.dineahead.application.UserService;
import com.dineahead.domain.User;
import com.dineahead.domain.UserResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private UserResponseDTO mapToDTO(User user) {
        return new UserResponseDTO(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(), user.getAvatarUrl());
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
    public ResponseEntity<UserResponseDTO> login(@RequestBody User user) {
        return ResponseEntity.ok(mapToDTO(userService.loginUser(user.getEmail(), user.getPasswordHash())));
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
}