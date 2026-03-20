package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** User repository. */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

  /**
   * Find a user by its email.
   *
   * @param email the email
   * @return the user
   */
  User findByEmail(String email);

  /**
   * Find a user by email wrapped in an Optional.
   *
   * @param email user email
   * @return optional user
   */
  Optional<User> findOptionalByEmail(String email);
}
