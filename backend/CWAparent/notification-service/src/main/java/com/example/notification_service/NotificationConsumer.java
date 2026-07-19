package com.example.notification_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationConsumer {

    private final NotificationService notificationService;

    @Autowired
    public NotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "notification-events", groupId = "notification-service-group")
    public void consumeNotificationEvent(String message) {
        // Process the notification event
        System.out.println("Received notification event: " + message);

        // Trigger notification logic
        notificationService.sendNotification(message);
    }
}
