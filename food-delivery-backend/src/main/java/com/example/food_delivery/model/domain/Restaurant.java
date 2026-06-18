package com.example.food_delivery.model.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @Embedded
    private Address address;

    @Embedded
    private Coordinates coordinates;

    private Integer deliveryTimeEstimate; // in minutes
    private String category;
    private Double averageRating;
    private Integer deliveryTimeMinutes;
    private String openHours;

    private Boolean isOpen;
    private String imageUrl;

    public Restaurant(String name, String description, String imageUrl,String openHours, String category, Boolean isOpen, Integer deliveryTimeEstimate,Double averageRating) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.deliveryTimeEstimate = deliveryTimeEstimate;
        this.imageUrl = imageUrl;
        this.averageRating=averageRating;
        this.isOpen=isOpen;
        this.openHours=openHours;
    }

    public Restaurant(String name, String description, String openHours,
                      String imageUrl, String category, Integer deliveryTimeEstimate) {
        this.name = name;
        this.description = description;
        this.openHours = openHours;
        this.imageUrl = imageUrl;
        this.category = category;
        this.deliveryTimeEstimate = deliveryTimeEstimate;
        this.isOpen = true;         // sensible default
        this.averageRating = 0.0;   // sensible default
    }

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeliveryZone> deliveryZones = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> Products = new ArrayList<>();

    public Restaurant(String name, String description) {
        this.name=name;
        this.description=description;
    }
    public Restaurant(){}

    public Restaurant(String name, String description, String openHours, String imageUrl, String category,Boolean isOpen,Integer deliveryTimeEstimate) {
        this.name = name;
        this.description = description;
        this.openHours = openHours;
        this.imageUrl = imageUrl;
        this.category = category;
        this.deliveryTimeEstimate=deliveryTimeEstimate;
        this.isOpen=isOpen;
    }

    /* ---- Full constructor (use this in your seeder) ---- */
    public Restaurant(
            String name,
            String description,
            Address address,
            Coordinates coordinates,
            String category,
            Double averageRating,
            Integer deliveryTimeEstimate,   // canonical
            String openHours,
            Boolean isOpen,
            String imageUrl
    ) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.coordinates = coordinates;
        this.category = category;
        this.averageRating = averageRating;
        this.openHours = openHours;
        this.isOpen = isOpen;
        this.imageUrl = imageUrl;

        setDeliveryTimeEstimate(deliveryTimeEstimate);
    }
}
