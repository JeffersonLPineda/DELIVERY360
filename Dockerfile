FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -DskipTests clean package

RUN JAR=$(find target -maxdepth 1 -type f -name "*.jar" ! -name "original-*.jar" | head -n 1) \
    && cp "$JAR" app.jar


FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/app.jar app.jar

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "app.jar"]