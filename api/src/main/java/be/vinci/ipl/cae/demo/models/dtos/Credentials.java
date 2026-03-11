package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Credentials DTO.
 */
@Data
@NoArgsConstructor
public class Credentials {

  private String email;
  private String password;
  private String tag;
  private String specialty;
  private String profileImage;
  private String oldPassword;
  private String newPassword;

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }

  public String getTag() {
    return tag;
  }

  public String getSpecialty() {
    return specialty;
  }

  public String getProfileImage() {
    return profileImage;
  }

  public String getOldPassword() {
    return oldPassword;
  }

  public String getNewPassword() {
    return newPassword;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public void setTag(String tag) {
    this.tag = tag;
  }

  public void setSpecialty(String specialty) {
    this.specialty = specialty;
  }

  public void setProfileImage(String profileImage) {
    this.profileImage = profileImage;
  }

  public void setOldPassword(String oldPassword) {
    this.oldPassword = oldPassword;
  }

  public void setNewPassword(String newPassword) {
    this.newPassword = newPassword;
  }
}
