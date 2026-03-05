package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Pizza;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Pizza entities.
 */
@Repository
public interface PizzaRepository extends CrudRepository<Pizza, Long> {

  /**
   * Finds all pizzas ordered by title ascending.
   *
   * @return all pizzas sorted by title ASC.
   */
  Iterable<Pizza> findAllByOrderByTitleAsc();

  /**
   * Finds all pizzas ordered by title descending.
   *
   * @return all pizzas sorted by title DESC.
   */
  Iterable<Pizza> findAllByOrderByTitleDesc();
}
