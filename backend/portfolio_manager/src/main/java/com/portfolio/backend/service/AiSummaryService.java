package com.portfolio.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@SuppressWarnings("unchecked")
@Service
public class AiSummaryService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String summarizePortfolio(Map<String, Object> payload) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
        System.out.println("Gemini key loaded? " + (geminiApiKey != null && !geminiApiKey.isBlank()));

        Map<String, Object> body = Map.of(
            "contents", new Object[] {
                Map.of("parts", new Object[] {
                    Map.of("text",
                        "You are a concise finance assistant. Write a 2–3 sentence summary based ONLY on this data. " +
                        "Mention total value, total profit/loss, any alerts, and explain what XIRR means in plain English (e.g., annualized return). " +
                        "No predictions. End with a short disclaimer. Data: " + payload
                    )
                })
            }
        );

        try {
            var response = restTemplate.postForObject(url, body, Map.class);
            if (response == null) {
                return "Summary unavailable.";
            }
            // Extract text safely
            var candidates = (java.util.List<Map<String, Object>>) response.get("candidates");
            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (java.util.List<Map<String, Object>>) content.get("parts");
            return parts.get(0).get("text").toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "Summary unavailable.";
        }
    }
}