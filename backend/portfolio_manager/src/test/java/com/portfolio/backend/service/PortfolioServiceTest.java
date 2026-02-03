package com.portfolio.backend;

import org.junit.jupiter.api.Test;

public class PortfolioServiceTest {
    @Test
    void portfolioSummary_shouldContainTotals() {
        var summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary.get("totalValue"));
        assertNotNull(summary.get("totalCost"));
    }

}
