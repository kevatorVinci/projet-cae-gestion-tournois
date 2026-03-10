package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Configuration class for BCrypt password encoder.
 */
@Configuration
public class BcryptConfiguration {

  /**
   * Creates a BCryptPasswordEncoder bean.
   *
   * @return a new BCryptPasswordEncoder instance.
   */
  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

}
