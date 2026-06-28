package com.example.food_delivery.config.security;

import com.example.food_delivery.web.filters.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class JwtSecurityWebConfig {

    private final JwtFilter jwtFilter;

    public JwtSecurityWebConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:8080"
        ));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role("ADMIN").implies("COURIER")
                .role("ADMIN").implies("RESTAURANT_OWNER")
                .role("COURIER").implies("CUSTOMER")
                .build();
    }

    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setRoleHierarchy(roleHierarchy);
        return expressionHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .authorizeHttpRequests(auth -> auth
                        // --- Public endpoints ---
                        .requestMatchers(
                                "/error",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/h2/**",
                                "/api/user/register",
                                "/api/user/login",
                                "/api/restaurants",
                                "/api/restaurants/{id}",
                                "/api/products",
                                "/api/products/{id}",
                                "/api/products/details/{id}",
                                "/api/promotions/**",
                                "/api/reviews/**",
                                "/api/orders/address/{id}",
                                "/api/user/{username}/password",
                                "/api/sentiment/**",
                                "/api/rfm/**",
                                "/api/group-orders/**"
                        ).permitAll()
                        // --- Authenticated user (any role) ---
                        .requestMatchers("/api/user/me").authenticated()
                        // --- Customer endpoints ---
                        .requestMatchers(
                                "/api/products/add-to-order/{id}",
                                "/api/products/remove-from-order/{id}",
                                "/api/orders/pending",
                                "/api/orders/cart",
                                "/api/orders/cart/**",
                                "/api/orders/pending/confirm",
                                "/api/orders/pending/cancel",
                                "/api/orders/my-orders",
                                "/api/orders/track/{id}",
                                "/api/payments/**",
                                "/api/recommendations/cross-sell",
                                "/api/recommendations/**",
                                "/api/recommendations/advanced/**",
                                "/api/couriers/rate/**"
                        ).hasAnyRole("CUSTOMER", "ADMIN")
                        // --- Courier endpoints ---
                        .requestMatchers(
                                "/api/orders/confirmed",
                                "/api/couriers/assign/{orderId}",
                                "/api/couriers/complete/{orderId}",
                                "/api/couriers/my-orders",
                                "/api/couriers/my-delivered-orders",
                                "/api/couriers/my-available-orders",
                                "/api/couriers/my-zone",
                                "/api/couriers/zones"
                        ).hasAnyRole("COURIER", "ADMIN")
                        // --- Restaurant owner endpoints ---
                        .requestMatchers("/api/owner/**").hasAnyRole("RESTAURANT_OWNER", "ADMIN")
                        // --- Admin-only endpoints ---
                        .requestMatchers(
                                "/api/products/add",
                                "/api/products/edit/{id}",
                                "/api/products/delete/{id}",
                                "/api/restaurants/add",
                                "/api/restaurants/edit/{id}",
                                "/api/restaurants/delete/{id}",
                                "/api/admin/**",
                                "/api/admin/couriers/**"
                        ).hasRole("ADMIN")
                        // --- Admin-only user management (must come AFTER /api/user/login and /api/user/register) ---
                        .requestMatchers("/api/user/**").hasRole("ADMIN")
                        .anyRequest().hasRole("ADMIN")
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
