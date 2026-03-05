package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Drink;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Drink entities.
 */
@Repository
public interface DrinkRepository extends CrudRepository<Drink, Long> {

  /**
   * Finds all drinks with a price less than or equal to the given value.
   *
   * @param price the maximum price.
   * @return all matching drinks.
   */
  Iterable<Drink> findAllByPriceLessThanEqual(double price);

}
