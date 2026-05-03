package com.blog.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 限流注解，用于标记需要限流的方法。
 * 使用Redis滑动窗口算法实现。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * 限流键前缀（如：login, register）
     */
    String key() default "";

    /**
     * 时间窗口内允许的最大请求数
     */
    int limit() default 10;

    /**
     * 时间窗口，单位秒
     */
    int window() default 60;

    /**
     * 限流提示消息
     */
    String message() default "请求过于频繁，请稍后再试";
}
