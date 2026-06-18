package com.example.food_delivery.model.exceptions;

public class ProductOutOfStockException extends RuntimeException {

    public ProductOutOfStockException(Long id) {
        super(String.format("Product with ID %s is out of stock.", id));
    }

}
