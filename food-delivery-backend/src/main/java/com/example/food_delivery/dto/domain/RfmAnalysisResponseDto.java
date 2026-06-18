package com.example.food_delivery.dto.domain;

import java.util.List;

/**
 * DTO representing the response from running RFM analysis.
 */
public record RfmAnalysisResponseDto(
        String status,
        String message,
        Integer daysAnalyzed,
        Integer customerCount,
        Integer segmentCount,
        List<RfmSegmentSummaryDto> segments
) {
}
