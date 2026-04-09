package be.vinci.ipl.cae.demo.models.dtos.team;

import com.fasterxml.jackson.annotation.JsonProperty;

import be.vinci.ipl.cae.demo.models.dtos.member.MemberPublicDto;

import java.util.List;

/** DTO for public team information. */
public record TeamPublicDto(
        Long id,
        String name,
        String profileImage,
        List<MemberPublicDto> membres,
        @JsonProperty("isResponsable") boolean isResponsable) {}