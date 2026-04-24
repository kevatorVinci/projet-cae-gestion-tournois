package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for user-facing authentication DTO conversions. */
@Component
public class UserMapper {

  /**
   * Converts a user to authenticated payload and injects an already-generated token.
   *
   * @param user the user entity.
   * @param token the JWT token.
   * @return the authenticated user DTO.
   */
  public AuthenticatedUser toAuthenticatedUser(User user, String token) {
    AuthenticatedUser dto = toAuthenticatedUser(user);
    dto.setToken(token);
    return dto;
  }

  /**
   * Converts a user to authenticated payload without token.
   *
   * @param user the user entity.
   * @return the authenticated user DTO.
   */
  public AuthenticatedUser toAuthenticatedUser(User user) {
    AuthenticatedUser dto = new AuthenticatedUser();
    if (user == null) {
      return dto;
    }

    dto.setEmail(user.getEmail());
    dto.setTag(user.getTag());
    dto.setSpecialty(user.getSpecialty());
    dto.setProfileImage(user.getProfileImageUrl());
    dto.setAdmin(user.isAdmin());
    dto.setBanned(user.isBanned());
    dto.setBanReason(user.getBanReason());
    return dto;
  }

  /**
   * Converts many user entities to authenticated payloads.
   *
   * @param users the list of users.
   * @return a list of authenticated user DTOs.
   */
  public List<AuthenticatedUser> toAuthenticatedUsers(Iterable<User> users) {
    List<AuthenticatedUser> result = new ArrayList<>();
    if (users != null) {
      for (User user : users) {
        result.add(toAuthenticatedUser(user));
      }
    }
    return result;
  }
}
