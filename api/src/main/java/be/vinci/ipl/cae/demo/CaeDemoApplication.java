package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public final class CaeDemoApplication {

  private CaeDemoApplication() {
  }

  public static void main(String[] args) {
    SpringApplication.run(CaeDemoApplication.class, args);
  }
}