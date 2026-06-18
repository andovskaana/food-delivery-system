package com.example.food_delivery.dto.domain;

/**
 * DTO representing RFM (Recency, Frequency, Monetary) analysis data for a customer.
 */
public record CustomerRfmDto(
        String username,
        Integer recency,
        Integer frequency,
        Double monetary,
        Integer rScore,
        Integer fScore,
        Integer mScore,
        Integer rfmScore,
        String rfmSegment,
        String customerSegment,
        String segmentDescription
) {
}
