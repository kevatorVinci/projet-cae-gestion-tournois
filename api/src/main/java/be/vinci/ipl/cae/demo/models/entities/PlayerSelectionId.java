package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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