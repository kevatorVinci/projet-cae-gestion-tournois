FROM maven:3.9.9-amazoncorretto-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy AS prod
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 3000
CMD ["java", "-jar", "app.jar"]