package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

/** JwtAuthenticationFilter to handle user authentication. */
@Configuration
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final UserService userService;

  /**
   * Constructor for JwtAuthenticationFilter.
   *
   * @param userService the injected UserService.
   */
  public JwtAuthenticationFilter(UserService userService) {
    this.userService = userService;
  }

  /**
   * Filter to handle user authentication.
   *
   * @param request the request.
   * @param response the response.
   * @param filterChain the filter chain.
   * @throws ServletException the servlet exception.
   * @throws IOException the IO exception.
   */
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String token = request.getHeader("Authorization");
    if (token != null) {
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      String email = userService.verifyJwtToken(token);
      if (email != null) {
        User user = userService.readOneFromEmail(email);
        if (user != null) {
          List<GrantedAuthority> authorities = new ArrayList<>();
          if (user.isAdmin()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
          }
          if (isResponsable(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_RESPONSABLE"));
          }
          UsernamePasswordAuthenticationToken authentication =
              new UsernamePasswordAuthenticationToken(user, null, authorities);
          authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      }
    }
    filterChain.doFilter(request, response);
  }

  private boolean isResponsable(User user) {
    if (user == null || user.getEquipe() == null) {
      return false;
    }
    User principal = user.getEquipe().getResponsablePrincipal();
    User secondaire = user.getEquipe().getResponsableSecondaire();
    Long userId = user.getId();
    return (principal != null && principal.getId().equals(userId))
        || (secondaire != null && secondaire.getId().equals(userId));
  }
}
