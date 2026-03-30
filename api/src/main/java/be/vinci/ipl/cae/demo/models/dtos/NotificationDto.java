package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDateTime;

public record NotificationDto(
    Long idNotification,
    String message,
    LocalDateTime dateEnvoi,
    Boolean estLue) {}
