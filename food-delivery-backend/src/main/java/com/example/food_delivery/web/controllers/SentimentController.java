package com.example.food_delivery.web.controllers;

import com.example.food_delivery.service.domain.SentimentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sentiment")
public class SentimentController {

    private final SentimentService sentimentService;

    public SentimentController(SentimentService sentimentService) {
        this.sentimentService = sentimentService;
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<Double> getSentiment(@PathVariable Long restaurantId) {
        Double score = sentimentService.getSentimentScore(restaurantId);
        if (score == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(score); // <- frontend receives NUMBER
    }

    @GetMapping
    public ResponseEntity<Map<Long, Double>> getAllSentiments() {
        return ResponseEntity.ok(sentimentService.getAllSentimentScores());
    }
}
