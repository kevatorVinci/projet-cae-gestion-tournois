package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.dtos.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for user operations.
 */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

  /**
   * Finds a user by username.
   *
   * @param username the username to search for.
   * @return the user or null if not found.
   */
  User findByUsername(String username);
}

