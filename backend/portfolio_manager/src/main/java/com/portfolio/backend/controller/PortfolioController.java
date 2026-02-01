package com.portfolio.backend.controller;

import com.portfolio.backend.service.PortfolioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/value")
    public Map<String, BigDecimal> getTotalPortfolioValue() {
        return Map.of(
                "totalValue",
                portfolioService.calculateTotalPortfolioValue()
        );
    }
}
