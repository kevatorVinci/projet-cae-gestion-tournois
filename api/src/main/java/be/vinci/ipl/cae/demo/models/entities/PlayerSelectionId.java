package be.vinci.ipl.cae.demo.models.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Composite key class for PlayerSelection.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSelectionId implements Serializable {
    private Long match;
    private Long member;
}