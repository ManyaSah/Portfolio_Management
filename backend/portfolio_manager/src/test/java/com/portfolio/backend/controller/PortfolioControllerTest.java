package com.portfolio.backend.controller;

import com.portfolio.backend.service.PortfolioService;
import com.portfolio.backend.service.XirrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class PortfolioControllerTest {
    private MockMvc mockMvc;

    @Mock
    private PortfolioService portfolioService;

    @Mock
    private XirrService xirrService;

    @InjectMocks
    private PortfolioController portfolioController;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(portfolioController).build();
    }

    @Test
    public void testGetPortfolio() throws Exception {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalValue", 10000.00);
        summary.put("totalCost", 8000.00);
        summary.put("totalProfit", 2000.00);
        summary.put("totalTaxLiability", 300.00);

        when(portfolioService.getPortfolioSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalValue").value(10000.00))
                .andExpect(jsonPath("$.totalCost").value(8000.00))
                .andExpect(jsonPath("$.totalProfit").value(2000.00))
                .andExpect(jsonPath("$.totalTaxLiability").value(300.00));

        verify(portfolioService, times(1)).getPortfolioSummary();
    }

    @Test
    public void testGetXirr() throws Exception {
        String ticker = "AAPL";
        Double xirrPercent = 12.5;

        when(xirrService.computeXirrForTicker(ticker)).thenReturn(xirrPercent);

        mockMvc.perform(get("/api/portfolio/xirr/{ticker}", ticker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value(ticker))
                .andExpect(jsonPath("$.xirrPercent").value(12.5));

        verify(xirrService, times(1)).computeXirrForTicker(ticker);
    }

    @Test
    public void testGetXirrNull() throws Exception {
        String ticker = "INVALID";

        when(xirrService.computeXirrForTicker(ticker)).thenReturn(null);

        mockMvc.perform(get("/api/portfolio/xirr/{ticker}", ticker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value(ticker))
                .andExpect(jsonPath("$.xirrPercent").isEmpty());

        verify(xirrService, times(1)).computeXirrForTicker(ticker);
    }

}
