FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn package -DskipTests -Dpmd.skip=true -Dcheckstyle.skip=true

FROM eclipse-temurin:21-jre
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]