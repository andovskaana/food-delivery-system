package com.example.food_delivery.service.domain;

import com.example.food_delivery.dto.domain.CustomerRfmDto;
import com.example.food_delivery.dto.domain.RfmAnalysisResponseDto;
import com.example.food_delivery.dto.domain.RfmSegmentSummaryDto;

import java.util.List;

/**
 * Service interface for RFM (Recency, Frequency, Monetary) customer segmentation analysis.
 */
public interface RfmAnalysisService {

    /**
     * Run RFM analysis on all customers.
     *
     * @param daysBack Number of days to look back for transactions
     * @return Analysis response with summary statistics
     */
    RfmAnalysisResponseDto runAnalysis(int daysBack);

    /**
     * Get RFM analysis for a specific customer.
     *
     * @param username Customer username
     * @return Customer RFM data or null if not found
     */
    CustomerRfmDto getCustomerRfm(String username);

    /**
     * Get RFM analysis for all customers.
     *
     * @return List of all customers with their RFM data
     */
    List<CustomerRfmDto> getAllCustomersRfm();

    /**
     * Get summary statistics for all customer segments.
     *
     * @return List of segment summaries
     */
    List<RfmSegmentSummaryDto> getSegmentSummary();

    /**
     * Get all customers in a specific segment.
     *
     * @param segmentName Name of the segment (e.g., "Champions", "At Risk")
     * @return List of customers in the segment
     */
    List<CustomerRfmDto> getCustomersBySegment(String segmentName);
}
