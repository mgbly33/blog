package com.blog.service.impl;

import com.blog.exception.FileStorageException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final Map<String, String> CONTENT_TYPE_TO_EXTENSION = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp"
    );

    // Magic bytes for supported image formats
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] GIF_MAGIC = new byte[]{0x47, 0x49, 0x46};
    private static final byte[] WEBP_RIFF = new byte[]{0x52, 0x49, 0x46, 0x46};
    private static final byte[] WEBP_MARKER = new byte[]{0x57, 0x45, 0x42, 0x50};

    private final Path fileStorageLocation;

    public FileStorageServiceImpl(@Value("${app.upload.path:${app.upload.dir:uploads}}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("无法创建上传目录", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFileName)) {
            originalFileName = "upload";
        }
        originalFileName = StringUtils.cleanPath(originalFileName);

        try {
            // Path traversal protection
            if (originalFileName.contains("..")) {
                throw new FileStorageException("文件名包含非法路径: " + originalFileName);
            }

            // Content-Type validation
            String contentType = normalizeContentType(file.getContentType());
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
                throw new FileStorageException("仅允许上传图片文件，支持 JPEG/PNG/GIF/WEBP。");
            }

            // Extension whitelist validation. For clipboard/screenshot files without extension,
            // derive extension from content-type after validation.
            String fileExtension = extractExtension(originalFileName).toLowerCase(Locale.ROOT);
            if (!StringUtils.hasText(fileExtension)) {
                fileExtension = CONTENT_TYPE_TO_EXTENSION.get(contentType);
            }
            if (!StringUtils.hasText(fileExtension) || !ALLOWED_EXTENSIONS.contains(fileExtension)) {
                throw new FileStorageException(
                        "不支持的文件类型，支持: " + String.join(", ", ALLOWED_EXTENSIONS));
            }

            // Block SVG explicitly (even if extension is spoofed)
            if (fileExtension.equals(".svg") || fileExtension.equals(".svgz")) {
                throw new FileStorageException("出于安全原因，不允许上传 SVG 文件。");
            }

            // Magic byte validation
            validateMagicBytes(file);

            String newFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new FileStorageException("保存文件失败: " + originalFileName + "，请稍后重试。", ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("文件不存在：" + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("文件不存在：" + fileName, ex);
        }
    }

    private String extractExtension(String fileName) {
        if (fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf("."));
        }
        return "";
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return null;
        }
        return contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
    }

    private void validateMagicBytes(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int bytesRead = is.read(header);
            if (bytesRead < 3) {
                throw new FileStorageException("文件体积过小，无法识别为有效图片。");
            }

            boolean validMagic = startsWith(header, JPEG_MAGIC)
                    || startsWith(header, PNG_MAGIC)
                    || startsWith(header, GIF_MAGIC)
                    || isWebP(header);

            if (!validMagic) {
                throw new FileStorageException(
                        "文件内容与图片格式不匹配，文件可能已损坏或伪造。");
            }
        }
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        return Arrays.equals(data, 0, prefix.length, prefix, 0, prefix.length);
    }

    private boolean isWebP(byte[] header) {
        // WEBP format: RIFF....WEBP (RIFF at offset 0, WEBP at offset 8)
        return header.length >= 12
                && startsWith(header, WEBP_RIFF)
                && Arrays.equals(header, 8, 12, WEBP_MARKER, 0, 4);
    }
}
