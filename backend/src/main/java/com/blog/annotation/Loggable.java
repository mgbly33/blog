package com.blog.annotation;

import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that should be logged
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Loggable {

    /**
     * The type of action being performed
     */
    ActionType action();

    /**
     * The type of target entity
     */
    TargetType target() default TargetType.SYSTEM;

    /**
     * Description template. Can use SpEL expressions with # prefix.
     * Available variables:
     * - #args: method arguments array
     * - #result: method return value (only in success case)
     * - #user: current user principal (if authenticated)
     */
    String description() default "";

    /**
     * Whether to log asynchronously (default: true for performance)
     */
    boolean async() default true;

    /**
     * Whether to log failures (default: true)
     */
    boolean logFailures() default true;
}
