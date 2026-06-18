package com.example.food_delivery.dto.domain;

import com.example.food_delivery.model.domain.Courier;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DisplayCourierDto {
    private Long id;
    private String username;
    private String name;
    private Boolean active;

    public DisplayCourierDto(Long id, String username, String name, Boolean active) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.active = active;
    }

    public static DisplayCourierDto from(Courier courier) {
        return new DisplayCourierDto(
                courier.getId(),
                courier.getUser() != null ? courier.getUser().getUsername() : null,
                courier.getName(),
                courier.getActive()
        );
    }
}
