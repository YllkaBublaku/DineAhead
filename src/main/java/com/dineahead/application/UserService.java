package com.dineahead.application;

import com.dineahead.domain.Restaurant;
import com.dineahead.domain.User;
import com.dineahead.domain.enums.Role;
import com.dineahead.infrastructure.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class UserService {
    private final UserRepository userRepository;
    private  final PasswordEncoder passwordEncoder;
    private final RestaurantService restaurantService;
    private final JavaMailSender mailSender;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, RestaurantService restaurantService, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.restaurantService = restaurantService;
        this.mailSender = mailSender;
    }

    public User registerUser(User user) {
        if(userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User registerRestaurant(Map<String, Object> payload) {
        User user = new User();
        user.setFirstName((String) payload.get("firstName"));
        user.setLastName((String) payload.get("lastName"));
        user.setEmail((String) payload.get("email"));
        user.setPasswordHash((String) payload.get("passwordHash"));
        user.setRole(Role.ADMIN);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = registerUser(user);

        Restaurant restaurant = new Restaurant();
        String restaurantName = (String) payload.get("restaurantName");
        restaurant.setName(restaurantName);
        restaurant.setSlug(restaurantName.toLowerCase().replace(" ", "-"));
        restaurant.setOwner(savedUser);

        restaurantService.createRestaurant(restaurant);

        return savedUser;
    }


    public User loginUser(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return;
        }

        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("DineAhead Password Reset");
        message.setText("Hello " + user.getFirstName() + ",\n\n" +
                "We received a request to reset your password.\n\n" +
                "Click the link below to reset it:\n" +
                "http://localhost:4200/reset-password?token=" + token + "\n\n" +
                "This link will expire in 30 minutes.\n\n" +
                "If you didn't request this, you can safely ignore this email.");

        mailSender.send(message);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
