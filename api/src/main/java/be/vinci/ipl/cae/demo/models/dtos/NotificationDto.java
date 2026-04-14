package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for notifications.
 */
public record NotificationDto(
        Long id,
        String message,
        LocalDateTime sentDate,
        Boolean isRead) {
}