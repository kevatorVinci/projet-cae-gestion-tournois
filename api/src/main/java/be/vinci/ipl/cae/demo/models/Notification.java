package be.vinci.ipl.cae.demo.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

// models/Notification.java
@Entity
@Table(name = "notification")
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_notification")
  private Long idNotification;

  @Column(name = "type", nullable = false)
  // New field for notification type (e.g., 'success', 'event')
  private String type;

  @Column(name = "title", nullable = false)  // New field for notification title
  private String title;

  @Column(name = "message", nullable = false)
  private String message;

  @Column(name = "reason")  // New field for optional reason (e.g., for errors)
  private String reason;

  @Column(name = "date_envoi", nullable = false)
  private LocalDateTime dateEnvoi;

  @Column(name = "est_lue", nullable = false)
  private Boolean estLue = false;

  @Column(name = "date_lecture")
  private LocalDateTime dateLecture; // nullable

  @ManyToOne
  @JoinColumn(name = "id_membre", nullable = false)
  private Membre membre;

  // Getters and setters (add these for all fields)
  public Long getIdNotification() {
    return idNotification;
  }

  public void setIdNotification(Long idNotification) {
    this.idNotification = idNotification;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public LocalDateTime getDateEnvoi() {
    return dateEnvoi;
  }

  public void setDateEnvoi(LocalDateTime dateEnvoi) {
    this.dateEnvoi = dateEnvoi;
  }

  public Boolean getEstLue() {
    return estLue;
  }

  public void setEstLue(Boolean estLue) {
    this.estLue = estLue;
  }

  public LocalDateTime getDateLecture() {
    return dateLecture;
  }

  public void setDateLecture(LocalDateTime dateLecture) {
    this.dateLecture = dateLecture;
  }

  public Membre getMembre() {
    return membre;
  }

  public void setMembre(Membre membre) {
    this.membre = membre;
  }
}