package be.vinci.ipl.cae.demo.models.dtos.team;

import jakarta.validation.constraints.NotNull;

/** DTO for joining a team. */
public record TeamJoinDto(@NotNull Long teamId) {}