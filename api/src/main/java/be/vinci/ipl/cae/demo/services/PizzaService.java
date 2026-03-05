package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NewPizza;
import be.vinci.ipl.cae.demo.models.entities.Pizza;
import be.vinci.ipl.cae.demo.repositories.PizzaRepository;
import org.springframework.stereotype.Service;

/**
 * Service for pizza operations.
 */
@Service
public class PizzaService {

  private final PizzaRepository pizzaRepository;

  /**
   * Constructor for PizzaService.
   *
   * @param pizzaRepository the pizza repository.
   */
  public PizzaService(PizzaRepository pizzaRepository) {
    this.pizzaRepository = pizzaRepository;
  }

  /**
   * Returns all pizzas, optionally sorted by title.
   *
   * @param order optional sort order ("title" or "-title").
   * @return all pizzas.
   */
  public Iterable<Pizza> readAllPizzas(String order) {
    if (order == null || !order.contains("title")) {
      return pizzaRepository.findAll();
    }

    if (order.contains("-")) {
      return pizzaRepository.findAllByOrderByTitleDesc();
    }
    return pizzaRepository.findAllByOrderByTitleAsc();
  }

  /**
   * Returns a single pizza by ID.
   *
   * @param id the pizza ID.
   * @return the pizza or null if not found.
   */
  public Pizza readPizzaById(Long id) {
    return pizzaRepository.findById(id).orElse(null);
  }

  /**
   * Creates a new pizza.
   *
   * @param newPizza the pizza data.
   * @return the saved pizza.
   */
  public Pizza createPizza(NewPizza newPizza) {
    Pizza pizza = new Pizza();
    pizza.setTitle(newPizza.getTitle());
    pizza.setContent(newPizza.getContent());
    return pizzaRepository.save(pizza);
  }

  /**
   * Deletes a pizza by ID.
   *
   * @param id the pizza ID.
   * @return the deleted pizza or null if not found.
   */
  public Pizza deletePizza(Long id) {
    Pizza pizza = pizzaRepository.findById(id).orElse(null);
    if (pizza != null) {
      pizzaRepository.delete(pizza);
    }
    return pizza;
  }

  /**
   * Updates an existing pizza.
   *
   * @param id       the pizza ID.
   * @param newPizza the updated data.
   * @return the updated pizza or null if not found.
   */
  public Pizza updatePizza(Long id, NewPizza newPizza) {
    Pizza pizza = pizzaRepository.findById(id).orElse(null);
    if (pizza == null) {
      return null;
    }

    if (newPizza.getTitle() != null) {
      pizza.setTitle(newPizza.getTitle());
    }
    if (newPizza.getContent() != null) {
      pizza.setContent(newPizza.getContent());
    }

    return pizzaRepository.save(pizza);
  }

}
