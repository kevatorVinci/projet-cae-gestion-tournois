package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDateTime;

public record NotificationDto(
  Long id,
  String message,
  LocalDateTime sentDate,
  Boolean isRead) {
}