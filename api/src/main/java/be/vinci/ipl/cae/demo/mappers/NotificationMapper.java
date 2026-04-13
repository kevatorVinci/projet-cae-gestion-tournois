package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

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

  public List<NotificationDto> toDtos(Iterable<Notification> notifications) {
    List<NotificationDto> result = new ArrayList<>();
    for (Notification notification : notifications) {
      result.add(toDto(notification));
    }
    return result;
  }
}