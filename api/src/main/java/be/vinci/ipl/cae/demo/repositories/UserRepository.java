package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for User entities.
 */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

  /**
   * Finds a user by username.
   *
   * @param username the username to search for.
   * @return the matching user or null.
   */
  User findByUsername(String username);
}
