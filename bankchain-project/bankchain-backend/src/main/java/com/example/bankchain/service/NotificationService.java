package com.example.bankchain.service;

import com.example.bankchain.entity.Notification;
import com.example.bankchain.entity.User;
import com.example.bankchain.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notify(User recipient, String message, String entityType, Long entityId, String status) {
        if (recipient == null) return;
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .status(status)
                .isRead(false)
                .build());
    }

    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
