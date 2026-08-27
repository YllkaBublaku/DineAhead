package com.dineahead.application;

import com.dineahead.domain.Notification;
import com.dineahead.domain.User;
import com.dineahead.infrastructure.NotificationRepository;
import com.dineahead.infrastructure.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification sendNotification(Long userId, Notification notification) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        notification.setUser(user);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }
}
