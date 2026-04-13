package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Mapper component to convert Notification entities into Data Transfer Objects.
 */
@Component
public class NotificationMapper {

  /**
   * Converts a Notification entity to its DTO representation.
   *
   * @param notification the entity to convert.
   * @return the corresponding DTO, or null if input is null.
   */
  public NotificationDto toDto(Notification notification) {
    if (notification == null) {
      return null;
    }

    return new NotificationDto(
      notification.getId(),
      notification.getMessage(),
      notification.getSentDate(),
      notification.getIsRead());
  }

  /**
   * Converts a list of Notification entities to a list of DTOs.
   *
   * @param notifications an iterable collection of notification entities.
   * @return a list of notification DTOs.
   */
  public List<NotificationDto> toDtos(Iterable<Notification> notifications) {
    List<NotificationDto> result = new ArrayList<>();
    if (notifications != null) {
      for (Notification notification : notifications) {
        result.add(toDto(notification));
      }
    }
    return result;
  }
}