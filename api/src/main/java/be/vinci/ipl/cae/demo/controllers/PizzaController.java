package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.NewPizza;
import be.vinci.ipl.cae.demo.models.entities.Pizza;
import be.vinci.ipl.cae.demo.services.PizzaService;
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
 * REST controller for pizza endpoints.
 */
@RestController
@RequestMapping("/pizzas")
public class PizzaController {

  private final PizzaService pizzaService;

  /**
   * Constructor for PizzaController.
   *
   * @param pizzaService the pizza service.
   */
  public PizzaController(PizzaService pizzaService) {
    this.pizzaService = pizzaService;
  }

  /**
   * Returns all pizzas, optionally sorted by order.
   *
   * @param order optional sort order.
   * @return all pizzas.
   */
  @GetMapping({"", "/"})
  public Iterable<Pizza> getPizzas(@RequestParam(required = false) String order) {
    return pizzaService.readAllPizzas(order);
  }

  /**
   * Returns a single pizza by ID.
   *
   * @param id the pizza ID.
   * @return the pizza.
   */
  @GetMapping("/{id}")
  public Pizza getPizza(@PathVariable long id) {
    Pizza pizza = pizzaService.readPizzaById(id);
    if (pizza == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return pizza;
  }

  /**
   * Creates a new pizza.
   *
   * @param newPizza the new pizza data from the request body.
   * @return the created pizza.
   */
  @PostMapping({"", "/"})
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Pizza addPizza(@RequestBody NewPizza newPizza) {
    if (newPizza == null
        || newPizza.getTitle() == null
        || newPizza.getTitle().isBlank()
        || newPizza.getContent() == null
        || newPizza.getContent().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    return pizzaService.createPizza(newPizza);
  }

  /**
   * Deletes a pizza by ID.
   *
   * @param id the pizza ID.
   * @return the deleted pizza.
   */
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Pizza deletePizza(@PathVariable long id) {
    Pizza pizza = pizzaService.deletePizza(id);
    if (pizza == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return pizza;
  }

  /**
   * Updates an existing pizza.
   *
   * @param id       the pizza ID.
   * @param newPizza the updated pizza data.
   * @return the updated pizza.
   */
  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public Pizza updatePizza(@PathVariable long id, @RequestBody NewPizza newPizza) {
    if (newPizza == null
        || (newPizza.getTitle() != null && newPizza.getTitle().isBlank())
        || (newPizza.getContent() != null && newPizza.getContent().isBlank())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    Pizza pizza = pizzaService.updatePizza(id, newPizza);
    if (pizza == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return pizza;
  }

}
