package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.services.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** SecurityConfiguration to handle security configuration. */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity()
public class SecurityConfiguration {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  /**
   * Constructor for SecurityConfiguration.
   *
   * @param jwtAuthenticationFilter the injected JwtAuthenticationFilter.
   */
  public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }
  
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    return http.csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .sessionManagement(
                    sessionManagement ->
                            sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(
                    authorize ->
                            authorize
                                    .requestMatchers("/auths/**").permitAll() // Laisser passer la connexion
                                    .requestMatchers(HttpMethod.GET, "/equipes/**").permitAll() // Voir les équipes
                                    // 2. On accepte les requêtes vers nos indisponibilités
                                    .requestMatchers("/indisponibilites", "/indisponibilites/**").authenticated()
                                    .anyRequest().authenticated())
            // 3. IMPORTANT : Utiliser "this.jwtAuthenticationFilter"
            .addFilterBefore(this.jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(
                    exception ->
                            exception.authenticationEntryPoint(
                                    (request, response, authException) -> {
                                      response.sendError(401, "Unauthorized");
                                    }))
            .build();
  }
}
