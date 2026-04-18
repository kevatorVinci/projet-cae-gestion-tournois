package be.vinci.ipl.cae.demo.models.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for notifications.
 */
public record NotificationDto(
    @JsonProperty("idNotification") Long idNotification,
    String message,
    @JsonProperty("dateEnvoi") LocalDateTime dateEnvoi,
    @JsonProperty("estLue") Boolean estLue) {
}
