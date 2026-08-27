package com.dineahead.config;

import com.dineahead.domain.User;
import com.dineahead.domain.enums.Role;
import com.dineahead.infrastructure.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oauth2User = delegate.loadUser(userRequest);

        System.out.println("=== OAuth2 User Info ===");
        System.out.println("Attributes: " + oauth2User.getAttributes());

        String email = oauth2User.getAttribute("email");
        String firstName = oauth2User.getAttribute("given_name");
        String lastName = oauth2User.getAttribute("family_name");
        String picture = oauth2User.getAttribute("picture");

        System.out.println("Email: " + email);
        System.out.println("Picture: " + picture);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName != null ? firstName : "Google");
            user.setLastName(lastName != null ? lastName : "User");
            user.setPasswordHash("GOOGLE_OAUTH");
            user.setRole(Role.DINER);
            user.setCreatedAt(LocalDateTime.now());
            user.setAvatarUrl(picture);
            user = userRepository.save(user);
            System.out.println("Created new user: " + user.getEmail());
        } else {
            if (picture != null && !picture.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(picture);
                user = userRepository.save(user);
                System.out.println("Updated avatar for user: " + user.getEmail());
            }
            System.out.println("Found existing user: " + user.getEmail());
        }

        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());
        attributes.put("id", user.getId());
        attributes.put("role", user.getRole().toString());

        return new DefaultOAuth2User(
                oauth2User.getAuthorities(),
                attributes,
                "email"
        );
    }
}