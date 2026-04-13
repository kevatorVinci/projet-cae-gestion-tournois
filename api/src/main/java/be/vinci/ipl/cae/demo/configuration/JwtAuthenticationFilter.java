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

/**
 * JwtAuthenticationFilter to handle user authentication.
 */
@Configuration
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final UserService userService;

  public JwtAuthenticationFilter(UserService userService) {
    this.userService = userService;
  }

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
          if (isResponsible(user)) {
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

  private boolean isResponsible(User user) {
    if (user == null || user.getTeam() == null) {
      return false;
    }
    User primary = user.getTeam().getPrimaryResponsible();
    User secondary = user.getTeam().getSecondaryResponsible();
    Long userId = user.getId();
    return (primary != null && primary.getId().equals(userId))
      || (secondary != null && secondary.getId().equals(userId));
  }
}