package com.portfolio.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.service.PriceTargetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.portfolio.backend.TestUtils;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class PriceTargetControllerTest {
    private MockMvc mockMvc;

    @Mock
    private PriceTargetService priceTargetService;

    @InjectMocks
    private PriceTargetController priceTargetController;

    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(priceTargetController).build();
    }

    @Test
    public void testGetTargets() throws Exception {
        PriceTarget target1 = new PriceTarget();
        TestUtils.setId(target1, 1L);
        target1.setTicker("AAPL");
        target1.setTargetPrice(new BigDecimal("200.00"));
        target1.setAction("SELL");
        target1.setTriggered(false);

        PriceTarget target2 = new PriceTarget();
        TestUtils.setId(target2, 2L);
        target2.setTicker("GOOGL");
        target2.setTargetPrice(new BigDecimal("3000.00"));
        target2.setAction("BUY");
        target2.setTriggered(false);

        List<PriceTarget> targets = Arrays.asList(target1, target2);

        when(priceTargetService.getActiveTargets()).thenReturn(targets);

        mockMvc.perform(get("/api/targets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[1].ticker").value("GOOGL"))
                .andExpect(jsonPath("$[0].triggered").value(false));

        verify(priceTargetService, times(1)).getActiveTargets();
    }

    @Test
    public void testAddTarget() throws Exception {
        PriceTarget target = new PriceTarget();
        target.setTicker("MSFT");
        target.setTargetPrice(new BigDecimal("400.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        PriceTarget savedTarget = new PriceTarget();
        TestUtils.setId(savedTarget, 1L);
        savedTarget.setTicker("MSFT");
        savedTarget.setTargetPrice(new BigDecimal("400.00"));
        savedTarget.setAction("SELL");
        savedTarget.setTriggered(false);

        when(priceTargetService.saveTarget(any(PriceTarget.class))).thenReturn(savedTarget);

        mockMvc.perform(post("/api/targets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(target)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value("MSFT"))
                .andExpect(jsonPath("$.targetPrice").value(400.00));

        verify(priceTargetService, times(1)).saveTarget(any(PriceTarget.class));
    }

    @Test
    public void testGetTargetsEmpty() throws Exception {
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/targets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(priceTargetService, times(1)).getActiveTargets();
    }
}
