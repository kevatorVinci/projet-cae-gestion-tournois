package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** User repository. */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

  /**
   * Finds a user by its email.
   *
   * @param email the email of the user.
   * @return the user found, or null if no user matches.
   */
  User findByEmail(String email);

  /**
   * Finds a user by email wrapped in an Optional.
   *
   * @param email the user email.
   * @return an optional containing the user if found.
   */
  Optional<User> findOptionalByEmail(String email);
}
