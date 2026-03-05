package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NewDrink;
import be.vinci.ipl.cae.demo.models.entities.Drink;
import be.vinci.ipl.cae.demo.repositories.DrinkRepository;
import org.springframework.stereotype.Service;

/**
 * Service for drink operations.
 */
@Service
public class DrinkService {

  private final DrinkRepository drinkRepository;

  /**
   * Constructor for DrinkService.
   *
   * @param drinkRepository the drink repository.
   */
  public DrinkService(DrinkRepository drinkRepository) {
    this.drinkRepository = drinkRepository;
  }

  /**
   * Returns all drinks.
   *
   * @return all drinks.
   */
  public Iterable<Drink> readAllDrinks() {
    return drinkRepository.findAll();
  }

  /**
   * Returns all drinks within the given budget.
   *
   * @param budget the maximum price.
   * @return all drinks within budget.
   */
  public Iterable<Drink> readAllDrinksWithinBudget(double budget) {
    return drinkRepository.findAllByPriceLessThanEqual(budget);
  }

  /**
   * Returns a single drink by ID.
   *
   * @param id the drink ID.
   * @return the drink or null if not found.
   */
  public Drink readOneDrink(Long id) {
    return drinkRepository.findById(id).orElse(null);
  }

  /**
   * Creates a new drink.
   *
   * @param newDrink the drink data.
   * @return the saved drink.
   */
  public Drink createOneDrink(NewDrink newDrink) {
    Drink drink = new Drink();
    drink.setTitle(newDrink.getTitle());
    drink.setImage(newDrink.getImage());
    drink.setVolume(newDrink.getVolume());
    drink.setPrice(newDrink.getPrice());
    return drinkRepository.save(drink);
  }

  /**
   * Deletes a drink by ID.
   *
   * @param id the drink ID.
   * @return the deleted drink or null if not found.
   */
  public Drink deleteOneDrink(Long id) {
    Drink drink = drinkRepository.findById(id).orElse(null);
    if (drink != null) {
      drinkRepository.delete(drink);
    }
    return drink;
  }

  /**
   * Updates an existing drink.
   *
   * @param id       the drink ID.
   * @param newDrink the updated data.
   * @return the updated drink or null if not found.
   */
  public Drink updateOneDrink(long id, NewDrink newDrink) {
    Drink drink = drinkRepository.findById(id).orElse(null);
    if (drink == null) {
      return null;
    }

    if (newDrink.getTitle() != null) {
      drink.setTitle(newDrink.getTitle());
    }
    if (newDrink.getImage() != null) {
      drink.setImage(newDrink.getImage());
    }
    if (newDrink.getVolume() > 0.0) {
      drink.setVolume(newDrink.getVolume());
    }
    if (newDrink.getPrice() > 0.0) {
      drink.setPrice(newDrink.getPrice());
    }

    return drinkRepository.save(drink);
  }

}
