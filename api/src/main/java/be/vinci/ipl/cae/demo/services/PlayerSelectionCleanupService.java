package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.repositories.PlayerSelectionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for cleanup actions on match player selections.
 */
@Service
public class PlayerSelectionCleanupService {

  private final PlayerSelectionRepository playerSelectionRepository;

  /**
   * Builds the cleanup service.
   *
   * @param playerSelectionRepository player selection repository.
   */
  public PlayerSelectionCleanupService(PlayerSelectionRepository playerSelectionRepository) {
    this.playerSelectionRepository = playerSelectionRepository;
  }

  /**
   * Removes a member from all future match selections.
   *
   * @param memberId member identifier.
   */
  @Transactional
  public void removeMemberFromFutureSelections(Long memberId) {
    if (memberId == null) {
      return;
    }
    playerSelectionRepository.deleteByMemberIdAndMatchScheduledDateTimeAfter(
        memberId,
        LocalDateTime.now()
    );
  }

  /**
   * Removes a member from upcoming match selections that fall inside a
   * date-based unavailability period.
   *
   * @param memberId member identifier.
   * @param startDate start date of unavailability (inclusive).
   * @param endDate end date of unavailability (inclusive).
   */
  @Transactional
  public void removeMemberFromSelectionsForUnavailabilityPeriod(
      Long memberId,
      LocalDate startDate,
      LocalDate endDate
  ) {
    if (memberId == null || startDate == null || endDate == null) {
      return;
    }

    LocalDate normalizedStart = startDate.isBefore(endDate) ? startDate : endDate;
    LocalDate normalizedEnd = endDate.isAfter(startDate) ? endDate : startDate;

    LocalDateTime fromDateTime = normalizedStart.atStartOfDay();
    LocalDateTime now = LocalDateTime.now();
    if (fromDateTime.isBefore(now)) {
      fromDateTime = now;
    }

    LocalDateTime toDateTimeExclusive = normalizedEnd.plusDays(1).atStartOfDay();

    if (!fromDateTime.isBefore(toDateTimeExclusive)) {
      return;
    }

    playerSelectionRepository
        .deleteByMemberIdAndMatchScheduledDateTimeGreaterThanEqualAndMatchScheduledDateTimeLessThan(
            memberId,
            fromDateTime,
            toDateTimeExclusive
        );
  }
}
