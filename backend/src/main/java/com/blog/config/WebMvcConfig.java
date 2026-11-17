package com.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.path:${app.upload.dir:uploads}}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!java.nio.file.Files.exists(uploadPath)) {
            Path backendUploadPath = Paths.get("backend", uploadDir).toAbsolutePath().normalize();
            if (java.nio.file.Files.exists(backendUploadPath)) {
                uploadPath = backendUploadPath;
            }
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath.toUri().toString());
    }
}
