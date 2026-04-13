package be.vinci.ipl.cae.demo.models.dtos.member;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for public member information.
 */
public record MemberPublicDto(
  Long id,
  String tag,
  String specialty,
  String profileImageUrl,
  @JsonProperty("isResponsable") boolean isResponsable) {
}
