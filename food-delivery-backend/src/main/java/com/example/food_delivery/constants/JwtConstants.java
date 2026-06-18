package com.example.food_delivery.constants;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtConstants {

    private static String secretKey;
    private static Long expirationTime;

    public static final String HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    @Value("${app.jwt.secret}")
    public void setSecretKey(String secret) {
        JwtConstants.secretKey = secret;
    }

    @Value("${app.jwt.expiration:864000000}")
    public void setExpirationTime(Long expiration) {
        JwtConstants.expirationTime = expiration;
    }

    public static String getSecretKey() {
        return secretKey;
    }

    public static Long getExpirationTime() {
        return expirationTime;
    }
}
