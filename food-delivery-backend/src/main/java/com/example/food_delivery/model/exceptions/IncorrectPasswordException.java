package com.example.food_delivery.model.exceptions;

public class IncorrectPasswordException extends RuntimeException {

    public IncorrectPasswordException() {
        super("The password is incorrect.");
    }

}
