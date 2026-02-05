package com.portfolio.backend.controller;

import com.portfolio.backend.service.AiSummaryService;
import com.portfolio.backend.service.PortfolioService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final PortfolioService portfolioService;
    private final AiSummaryService aiSummaryService;

    public AiController(PortfolioService portfolioService, AiSummaryService aiSummaryService) {
        this.portfolioService = portfolioService;
        this.aiSummaryService = aiSummaryService;
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> payload = portfolioService.getPortfolioSummary();
        String summary = aiSummaryService.summarizePortfolio(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        return response;
    }
}