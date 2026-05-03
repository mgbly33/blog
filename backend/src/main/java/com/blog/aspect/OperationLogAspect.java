package com.blog.aspect;

import com.blog.annotation.Loggable;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import com.blog.security.UserPrincipal;
import com.blog.service.OperationLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

/**
 * AOP Aspect for automatic operation logging
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class OperationLogAspect {

    private final OperationLogService operationLogService;

    @Around("@annotation(com.blog.annotation.Loggable)")
    public Object logOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Loggable loggable = method.getAnnotation(Loggable.class);

        // Get current user
        UserPrincipal user = getCurrentUser();
        Long operatorId = user != null ? user.getId() : null;
        String operatorName = user != null ? user.getUsername() : "Anonymous";

        // Get request
        HttpServletRequest request = getCurrentRequest();

        // Extract target info from arguments
        Object[] args = joinPoint.getArgs();
        Long targetId = extractTargetId(args);
        String targetName = extractTargetName(args, loggable.target());

        // Build description
        String description = buildDescription(loggable, method, args, null);

        Object result = null;
        try {
            // Execute the method
            result = joinPoint.proceed();

            // Update description with result if needed
            String finalDescription = buildDescription(loggable, method, args, result);

            // Log success
            if (loggable.async()) {
                operationLogService.logAsync(
                    operatorId,
                    operatorName,
                    loggable.action(),
                    loggable.target(),
                    targetId,
                    targetName,
                    finalDescription,
                    request
                );
            } else {
                operationLogService.log(
                    operatorId,
                    operatorName,
                    loggable.action(),
                    loggable.target(),
                    targetId,
                    targetName,
                    finalDescription,
                    request
                );
            }

            return result;
        } catch (Throwable ex) {
            // Log failure if configured
            if (loggable.logFailures()) {
                operationLogService.logFailure(
                    operatorId,
                    operatorName,
                    loggable.action(),
                    loggable.target(),
                    targetId,
                    targetName,
                    description,
                    ex.getMessage(),
                    request
                );
            }
            throw ex;
        }
    }

    /**
     * Get current authenticated user
     */
    private UserPrincipal getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
                return (UserPrincipal) auth.getPrincipal();
            }
        } catch (Exception e) {
            log.debug("Could not get current user: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Get current HTTP request
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            log.debug("Could not get current request: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extract target ID from method arguments
     */
    private Long extractTargetId(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }

        // First argument is often the ID
        Object firstArg = args[0];
        if (firstArg instanceof Long) {
            return (Long) firstArg;
        }
        if (firstArg instanceof String) {
            try {
                return Long.parseLong((String) firstArg);
            } catch (NumberFormatException e) {
                // Not a numeric ID
            }
        }

        return null;
    }

    /**
     * Extract target name from arguments based on target type
     */
    private String extractTargetName(Object[] args, TargetType targetType) {
        // This is a simplified implementation
        // In real scenarios, you might want to use SpEL or reflection
        if (args == null || args.length < 2) {
            return null;
        }

        // Try to find a String argument that might be a name/title
        for (Object arg : args) {
            if (arg instanceof String && ((String) arg).length() > 0 && ((String) arg).length() < 255) {
                return (String) arg;
            }
        }

        return null;
    }

    /**
     * Build operation description
     */
    private String buildDescription(Loggable loggable, Method method, Object[] args, Object result) {
        String template = loggable.description();

        if (template == null || template.isEmpty()) {
            // Generate default description
            return String.format("%s operation on %s",
                formatActionType(loggable.action()),
                loggable.target().name().toLowerCase()
            );
        }

        // Simple template replacement (could be enhanced with SpEL)
        String description = template;

        // Replace placeholders
        if (args != null) {
            for (int i = 0; i < args.length; i++) {
                description = description.replace("{" + i + "}",
                    args[i] != null ? args[i].toString() : "null");
            }
        }

        return description;
    }

    /**
     * Format action type to human-readable string
     */
    private String formatActionType(ActionType actionType) {
        String name = actionType.name();
        return name.replace("_", " ").toLowerCase();
    }
}
