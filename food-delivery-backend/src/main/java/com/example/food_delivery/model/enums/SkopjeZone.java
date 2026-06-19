package com.example.food_delivery.model.enums;

/**
 * Simplified zone model of Skopje for courier-restaurant proximity scoring.
 * No GPS — couriers select their current zone, restaurants are assigned a zone,
 * and ZoneDistanceMatrix gives an estimated travel time between any two zones.
 */
public enum SkopjeZone {
    CENTAR,
    KARPOSH,
    AERODROM,
    KISELA_VODA,
    GAZI_BABA,
    BUTEL
}
