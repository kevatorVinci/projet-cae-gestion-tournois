package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.NewDrink;
import be.vinci.ipl.cae.demo.models.entities.Drink;
import be.vinci.ipl.cae.demo.services.DrinkService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for drink endpoints.
 */
@RestController
@RequestMapping("/drinks")
public class DrinkController {

  private final DrinkService drinkService;

  /**
   * Constructor for DrinkController.
   *
   * @param drinkService the drink service.
   */
  public DrinkController(DrinkService drinkService) {
    this.drinkService = drinkService;
  }

  /**
   * Returns all drinks, optionally filtered by budget.
   *
   * @param budgetMax optional maximum budget filter.
   * @return all matching drinks.
   */
  @GetMapping({"", "/"})
  public Iterable<Drink> getDrinks(
      @RequestParam(name = "budget-max", required = false) Double budgetMax) {
    if (budgetMax != null) {
      return drinkService.readAllDrinksWithinBudget(budgetMax);
    }
    return drinkService.readAllDrinks();
  }

  /**
   * Returns a single drink by ID.
   *
   * @param id the drink ID.
   * @return the drink.
   */
  @GetMapping("/{id}")
  public Drink getDrink(@PathVariable(name = "id") long id) {
    Drink drink = drinkService.readOneDrink(id);
    if (drink == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return drink;
  }

  /**
   * Creates a new drink.
   *
   * @param newDrink the new drink data from the request body.
   * @return the created drink.
   */
  @PostMapping({"", "/"})
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Drink addDrink(@RequestBody NewDrink newDrink) {
    if (newDrink == null
        || newDrink.getTitle() == null
        || newDrink.getTitle().isBlank()
        || newDrink.getImage() == null
        || newDrink.getImage().isBlank()
        || newDrink.getVolume() <= 0
        || newDrink.getPrice() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    return drinkService.createOneDrink(newDrink);
  }

  /**
   * Deletes a drink by ID.
   *
   * @param id the drink ID.
   * @return the deleted drink.
   */
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Drink deleteDrink(@PathVariable(name = "id") long id) {
    Drink drink = drinkService.deleteOneDrink(id);
    if (drink == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return drink;
  }

  /**
   * Updates an existing drink.
   *
   * @param id       the drink ID.
   * @param newDrink the updated drink data.
   * @return the updated drink.
   */
  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Drink updateDrink(@PathVariable(name = "id") long id, @RequestBody NewDrink newDrink) {
    if (newDrink == null
        || (newDrink.getTitle() != null && newDrink.getTitle().isBlank())
        || (newDrink.getImage() != null && newDrink.getImage().isBlank())
        || newDrink.getVolume() < 0.0
        || newDrink.getPrice() < 0.0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    Drink drink = drinkService.updateOneDrink(id, newDrink);
    if (drink == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return drink;
  }

}
