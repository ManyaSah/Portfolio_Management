package com.portfolio.backend.controller;

import com.portfolio.backend.service.PortfolioService;
import com.portfolio.backend.service.XirrService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final XirrService xirrService;

    public PortfolioController(PortfolioService portfolioService, XirrService xirrService) {
        this.portfolioService = portfolioService;
        this.xirrService = xirrService;
    }

    @GetMapping
    public Map<String, Object> getPortfolio() {
        return portfolioService.getPortfolioSummary();
    }

    @GetMapping("/xirr/{ticker}")
    public Map<String, Object> getXirr(@PathVariable String ticker) {
        Double pct = xirrService.computeXirrForTicker(ticker);
        return Map.of("ticker", ticker, "xirrPercent", pct);
    }
}
