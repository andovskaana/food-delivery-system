package com.example.food_delivery.model.enums;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ROLE_CUSTOMER,
    ROLE_COURIER,
    ROLE_ADMIN,
    ROLE_RESTAURANT_OWNER
    ;

    @Override
    public String getAuthority() {
        return name();
    }
}
