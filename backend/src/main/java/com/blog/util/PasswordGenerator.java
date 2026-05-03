package com.blog.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class to generate BCrypt encoded passwords.
 * Run this class directly to generate a password hash.
 */
public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = args.length > 0 ? args[0] : "Admin@123";
        String encoded = encoder.encode(rawPassword);
        System.out.println("Raw password: " + rawPassword);
        System.out.println("BCrypt hash: " + encoded);
    }
}
