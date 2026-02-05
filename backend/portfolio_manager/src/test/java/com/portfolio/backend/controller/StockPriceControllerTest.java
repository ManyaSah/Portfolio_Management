package com.portfolio.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.service.PriceService;
import com.portfolio.backend.service.StockPriceService;
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
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class StockPriceControllerTest {
    private MockMvc mockMvc;

    @Mock
    private StockPriceService historyService;

    @Mock
    private PriceService priceService;

    @InjectMocks
    private StockPriceController stockPriceController;

    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(stockPriceController).build();
    }

    @Test
    public void testGetPriceHistory() throws Exception {
        String ticker = "AAPL";

        StockPrice price1 = new StockPrice();
        TestUtils.setId(price1, 1L);
        price1.setTicker(ticker);
        price1.setPriceDate(LocalDate.now().minusDays(2));
        price1.setClosePrice(new BigDecimal("150.00"));

        StockPrice price2 = new StockPrice();
        TestUtils.setId(price2, 2L);
        price2.setTicker(ticker);
        price2.setPriceDate(LocalDate.now().minusDays(1));
        price2.setClosePrice(new BigDecimal("155.00"));

        StockPrice price3 = new StockPrice();
        TestUtils.setId(price3, 3L);
        price3.setTicker(ticker);
        price3.setPriceDate(LocalDate.now());
        price3.setClosePrice(new BigDecimal("160.00"));

        List<StockPrice> prices = Arrays.asList(price1, price2, price3);

        when(historyService.getPriceHistory(ticker)).thenReturn(prices);

        mockMvc.perform(get("/api/prices/{ticker}", ticker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].ticker").value(ticker))
                .andExpect(jsonPath("$[1].ticker").value(ticker))
                .andExpect(jsonPath("$[2].ticker").value(ticker))
                .andExpect(jsonPath("$[0].closePrice").value(150.00))
                .andExpect(jsonPath("$[1].closePrice").value(155.00))
                .andExpect(jsonPath("$[2].closePrice").value(160.00));

        verify(historyService, times(1)).getPriceHistory(ticker);
    }

    @Test
    public void testAddPriceWithNumericPrice() throws Exception {
        String ticker = "GOOGL";
        BigDecimal price = new BigDecimal("2500.50");

        StockPrice savedPrice = new StockPrice();
        TestUtils.setId(savedPrice, 1L);
        savedPrice.setTicker(ticker);
        savedPrice.setClosePrice(price);
        savedPrice.setPriceDate(LocalDate.now());

        when(priceService.createPrice(eq(ticker), any(BigDecimal.class))).thenReturn(savedPrice);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("ticker", ticker);
        requestBody.put("price", 2500.50);

        mockMvc.perform(post("/api/prices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value(ticker));

        verify(priceService, times(1)).createPrice(eq(ticker), any(BigDecimal.class));
    }

    @Test
    public void testGetPriceHistoryEmpty() throws Exception {
        String ticker = "INVALID";

        when(historyService.getPriceHistory(ticker)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/prices/{ticker}", ticker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(historyService, times(1)).getPriceHistory(ticker);
    }
}
