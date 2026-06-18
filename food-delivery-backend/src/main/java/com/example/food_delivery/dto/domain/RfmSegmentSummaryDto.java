package com.example.food_delivery.dto.domain;

/**
 * DTO representing summary statistics for a customer segment.
 */
public record RfmSegmentSummaryDto(
        String segment,
        Integer customerCount,
        Double percentage,
        Double avgRecency,
        Double avgFrequency,
        Double avgMonetary,
        Double totalRevenue,
        String description
) {
}
