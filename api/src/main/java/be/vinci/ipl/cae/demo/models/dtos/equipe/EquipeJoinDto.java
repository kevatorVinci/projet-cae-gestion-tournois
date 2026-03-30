package be.vinci.ipl.cae.demo.models.dtos.equipe;

import jakarta.validation.constraints.NotNull;

/** DTO for joining a team. */
public record EquipeJoinDto(@NotNull Long equipeId) {}
