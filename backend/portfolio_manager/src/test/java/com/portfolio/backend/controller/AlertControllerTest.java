package com.portfolio.backend.controller;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.repo.PriceTargetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AlertControllerTest {
    private MockMvc mockMvc;

    @Mock
    private PriceTargetRepository priceTargetRepository;

    @InjectMocks
    private AlertController alertController;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(alertController).build();
    }

    @Test
    public void testGetAllAlerts() throws Exception {
        PriceTarget target1 = new PriceTarget();
        target1.setTicker("AAPL");
        target1.setTargetPrice(new BigDecimal("200.00"));
        target1.setAction("SELL");
        target1.setTriggered(false);

        PriceTarget target2 = new PriceTarget();
        target2.setTicker("GOOGL");
        target2.setTargetPrice(new BigDecimal("3000.00"));
        target2.setAction("BUY");
        target2.setTriggered(true);

        List<PriceTarget> targets = Arrays.asList(target1, target2);

        when(priceTargetRepository.findAll()).thenReturn(targets);

        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[1].ticker").value("GOOGL"));

        verify(priceTargetRepository, times(1)).findAll();
    }

    @Test
    public void testGetActiveAlerts() throws Exception {
        PriceTarget target1 = new PriceTarget();

        target1.setTicker("AAPL");
        target1.setTargetPrice(new BigDecimal("200.00"));
        target1.setAction("SELL");
        target1.setTriggered(false);

        PriceTarget target2 = new PriceTarget();
        target2.setTicker("MSFT");
        target2.setTargetPrice(new BigDecimal("400.00"));
        target2.setAction("BUY");
        target2.setTriggered(false);

        List<PriceTarget> activeTargets = Arrays.asList(target1, target2);

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(activeTargets);

        mockMvc.perform(get("/api/alerts/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[1].ticker").value("MSFT"))
                .andExpect(jsonPath("$[0].triggered").value(false))
                .andExpect(jsonPath("$[1].triggered").value(false));

        verify(priceTargetRepository, times(1)).findByTriggeredFalse();
    }

    @Test
    public void testGetAllAlertsEmpty() throws Exception {
        when(priceTargetRepository.findAll()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(priceTargetRepository, times(1)).findAll();
    }
}
