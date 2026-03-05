package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the data needed to create or update a pizza.
 */
@Data
@NoArgsConstructor
public class NewPizza {

  private String title;
  private String content;
}
