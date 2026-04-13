package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for notification DTO conversions. */
@Component
public class NotificationMapper {

  /** Converts one notification entity to DTO. */
  public NotificationDto toDto(Notification notification) {
    if (notification == null) {
      return null;
    }

    return new NotificationDto(
        notification.getIdNotification(),
        notification.getMessage(),
        notification.getDateEnvoi(),
        notification.getEstLue());
  }

  /** Converts a list of notification entities to DTOs. */
  public List<NotificationDto> toDtos(Iterable<Notification> notifications) {
    List<NotificationDto> result = new ArrayList<>();
    for (Notification notification : notifications) {
      result.add(toDto(notification));
    }
    return result;
  }
}
