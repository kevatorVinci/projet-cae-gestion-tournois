package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDateTime;

/** Public payload representing one notification item. */
public record NotificationDto(
    Long idNotification,
    String message,
    LocalDateTime dateEnvoi,
    Boolean estLue) {}
