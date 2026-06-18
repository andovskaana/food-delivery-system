package com.example.food_delivery.model.exceptions;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long id) {
        super(String.format("Product with ID %s does not exist.", id));
    }

}
