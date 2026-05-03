# =============================================================================
# Blog Backend Docker Image
# Multi-stage build: optimized image size and build cache
# =============================================================================

# Stage 1: build
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml and prefetch dependencies (Docker layer cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn package -DskipTests -B

# =============================================================================
# Stage 2: runtime
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Install required runtime utilities
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built JAR
COPY --from=builder /app/target/*.jar app.jar

# Fix ownership
RUN chown -R appuser:appgroup /app

# Run as non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# JVM tuning
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
