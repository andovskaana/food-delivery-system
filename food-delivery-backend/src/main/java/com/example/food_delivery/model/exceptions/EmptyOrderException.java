package com.example.food_delivery.model.exceptions;

public class EmptyOrderException extends RuntimeException {

    public EmptyOrderException() {
        super("The order is empty.");
    }

}
