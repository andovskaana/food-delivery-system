package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.dto.domain.CustomerRfmDto;
import com.example.food_delivery.dto.domain.RfmAnalysisResponseDto;
import com.example.food_delivery.dto.domain.RfmSegmentSummaryDto;
import com.example.food_delivery.service.domain.RfmAnalysisService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RfmAnalysisServiceImpl implements RfmAnalysisService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rfm.api.base-url:http://localhost:5002}")
    private String rfmApiBaseUrl;

    public RfmAnalysisServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public RfmAnalysisResponseDto runAnalysis(int daysBack) {
        try {
            String url = String.format("%s/api/rfm/analyze?days_back=%d", rfmApiBaseUrl, daysBack);

            String response = restTemplate.postForObject(url, null, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> segmentsRaw =
                    (List<Map<String, Object>>) responseMap.get("segments");

            List<RfmSegmentSummaryDto> segments = segmentsRaw != null ?
                    segmentsRaw.stream()
                            .map(this::mapToSegmentSummary)
                            .collect(Collectors.toList())
                    : Collections.emptyList();

            return new RfmAnalysisResponseDto(
                    (String) responseMap.get("status"),
                    (String) responseMap.get("message"),
                    responseMap.get("days_analyzed") != null ?
                            ((Number) responseMap.get("days_analyzed")).intValue() : daysBack,
                    responseMap.get("customer_count") != null ?
                            ((Number) responseMap.get("customer_count")).intValue() : 0,
                    responseMap.get("segment_count") != null ?
                            ((Number) responseMap.get("segment_count")).intValue() : segments.size(),
                    segments
            );

        } catch (Exception e) {
            System.err.println("Error calling RFM analyze API: " + e.getMessage());
            e.printStackTrace();
            return new RfmAnalysisResponseDto(
                    "error",
                    e.getMessage(),
                    daysBack,
                    0,
                    0,
                    Collections.emptyList()
            );
        }
    }

    @Override
    public CustomerRfmDto getCustomerRfm(String username) {
        try {
            String url = String.format("%s/api/rfm/customer/%s", rfmApiBaseUrl, username);

            String response = restTemplate.getForObject(url, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            // Check for error response
            if (responseMap.containsKey("error")) {
                return null;
            }

            return mapToCustomerRfm(responseMap);

        } catch (Exception e) {
            System.err.println("Error calling RFM customer API: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public List<CustomerRfmDto> getAllCustomersRfm() {
        try {
            String url = String.format("%s/api/rfm/customers", rfmApiBaseUrl);

            String response = restTemplate.getForObject(url, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> customersRaw =
                    (List<Map<String, Object>>) responseMap.get("customers");

            if (customersRaw == null || customersRaw.isEmpty()) {
                return Collections.emptyList();
            }

            return customersRaw.stream()
                    .map(this::mapToCustomerRfm)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error calling RFM customers API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    @Override
    public List<RfmSegmentSummaryDto> getSegmentSummary() {
        try {
            String url = String.format("%s/api/rfm/segments", rfmApiBaseUrl);

            String response = restTemplate.getForObject(url, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> segmentsRaw =
                    (List<Map<String, Object>>) responseMap.get("segments");

            if (segmentsRaw == null || segmentsRaw.isEmpty()) {
                return Collections.emptyList();
            }

            return segmentsRaw.stream()
                    .map(this::mapToSegmentSummary)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error calling RFM segments API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    @Override
    public List<CustomerRfmDto> getCustomersBySegment(String segmentName) {
        try {
            String url = String.format("%s/api/rfm/segment/%s", rfmApiBaseUrl, segmentName);

            String response = restTemplate.getForObject(url, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> customersRaw =
                    (List<Map<String, Object>>) responseMap.get("customers");

            if (customersRaw == null || customersRaw.isEmpty()) {
                return Collections.emptyList();
            }

            return customersRaw.stream()
                    .map(this::mapToCustomerRfmWithSegment)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error calling RFM segment API: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    private CustomerRfmDto mapToCustomerRfm(Map<String, Object> data) {
        return new CustomerRfmDto(
                (String) data.get("username"),
                data.get("recency") != null ? ((Number) data.get("recency")).intValue() : 0,
                data.get("frequency") != null ? ((Number) data.get("frequency")).intValue() : 0,
                data.get("monetary") != null ? ((Number) data.get("monetary")).doubleValue() : 0.0,
                data.get("r_score") != null ? ((Number) data.get("r_score")).intValue() : 0,
                data.get("f_score") != null ? ((Number) data.get("f_score")).intValue() : 0,
                data.get("m_score") != null ? ((Number) data.get("m_score")).intValue() : 0,
                data.get("rfm_score") != null ? ((Number) data.get("rfm_score")).intValue() : 0,
                (String) data.get("rfm_segment"),
                (String) data.get("customer_segment"),
                (String) data.get("segment_description")
        );
    }

    private CustomerRfmDto mapToCustomerRfmWithSegment(Map<String, Object> data) {
        return new CustomerRfmDto(
                (String) data.get("username"),
                data.get("recency") != null ? ((Number) data.get("recency")).intValue() : 0,
                data.get("frequency") != null ? ((Number) data.get("frequency")).intValue() : 0,
                data.get("monetary") != null ? ((Number) data.get("monetary")).doubleValue() : 0.0,
                data.get("r_score") != null ? ((Number) data.get("r_score")).intValue() : 0,
                data.get("f_score") != null ? ((Number) data.get("f_score")).intValue() : 0,
                data.get("m_score") != null ? ((Number) data.get("m_score")).intValue() : 0,
                data.get("rfm_score") != null ? ((Number) data.get("rfm_score")).intValue() : 0,
                (String) data.get("rfm_segment"),
                null, // segment not included in segment query response
                null  // description not included in segment query response
        );
    }

    private RfmSegmentSummaryDto mapToSegmentSummary(Map<String, Object> data) {
        return new RfmSegmentSummaryDto(
                (String) data.get("segment"),
                data.get("customer_count") != null ? ((Number) data.get("customer_count")).intValue() : 0,
                data.get("percentage") != null ? ((Number) data.get("percentage")).doubleValue() : 0.0,
                data.get("avg_recency") != null ? ((Number) data.get("avg_recency")).doubleValue() : 0.0,
                data.get("avg_frequency") != null ? ((Number) data.get("avg_frequency")).doubleValue() : 0.0,
                data.get("avg_monetary") != null ? ((Number) data.get("avg_monetary")).doubleValue() : 0.0,
                data.get("total_revenue") != null ? ((Number) data.get("total_revenue")).doubleValue() : 0.0,
                (String) data.get("description")
        );
    }
}
