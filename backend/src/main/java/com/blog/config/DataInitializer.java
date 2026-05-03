package com.blog.config;

import com.blog.entity.User;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data initializer for creating default admin account on application startup.
 *
 * This component checks if an admin user exists in the database,
 * and creates one if not found.
 *
 * Configuration can be customized via environment variables:
 * - ADMIN_USERNAME: Admin username (required when enabled)
 * - ADMIN_PASSWORD: Admin password (required when enabled)
 * - ADMIN_INIT_ENABLED: Enable/disable initialization (default: false)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.enabled:false}")
    private boolean adminInitEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!adminInitEnabled) {
            log.info("Admin initialization is disabled");
            return;
        }

        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.error("Admin initialization is enabled, but username/password is missing");
            return;
        }

        initializeAdmin();
    }

    private void initializeAdmin() {
        // Check if admin already exists
        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Admin user '{}' already exists, skipping initialization", adminUsername);
            return;
        }

        // Create admin user
        User admin = User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode(adminPassword))
                .bio("System Administrator")
                .isAdmin(true)
                .isBanned(false)
                .build();

        admin.generateDefaultAvatar();
        userRepository.save(admin);

        log.info("===========================================");
        log.info("Default admin account created successfully!");
        log.info("Username: {}", adminUsername);
        log.info("Password: [REDACTED]");
        log.info("===========================================");
        log.warn("SECURITY NOTICE: Rotate bootstrap credentials after initialization.");
    }
}
