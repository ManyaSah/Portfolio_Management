package com.portfolio.backend.service;

import com.portfolio.backend.TestUtils;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.StockPriceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class StockPriceServiceTest {

    @InjectMocks
    private StockPriceService stockPriceService;

    @Mock
    private StockPriceRepository stockPriceRepository;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetPriceHistory() {
        String ticker = "AAPL";
        LocalDate today = LocalDate.now();

        StockPrice price1 = new StockPrice();
        TestUtils.setId(price1, 1L);
        price1.setTicker(ticker);
        price1.setPriceDate(today.minusDays(2));
        price1.setClosePrice(new BigDecimal("150.00"));

        StockPrice price2 = new StockPrice();
        TestUtils.setId(price2, 2L);
        price2.setTicker(ticker);
        price2.setPriceDate(today.minusDays(1));
        price2.setClosePrice(new BigDecimal("155.00"));

        StockPrice price3 = new StockPrice();
        TestUtils.setId(price3, 3L);
        price3.setTicker(ticker);
        price3.setPriceDate(today);
        price3.setClosePrice(new BigDecimal("160.00"));

        List<StockPrice> prices = Arrays.asList(price1, price2, price3);

        when(stockPriceRepository.findByTickerOrderByPriceDate(ticker)).thenReturn(prices);

        List<StockPrice> result = stockPriceService.getPriceHistory(ticker);

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(ticker, result.get(0).getTicker());
        assertEquals(ticker, result.get(1).getTicker());
        assertEquals(ticker, result.get(2).getTicker());
        assertEquals(new BigDecimal("150.00"), result.get(0).getClosePrice());
        assertEquals(new BigDecimal("155.00"), result.get(1).getClosePrice());
        assertEquals(new BigDecimal("160.00"), result.get(2).getClosePrice());

        verify(stockPriceRepository, times(1)).findByTickerOrderByPriceDate(ticker);
    }

    @Test
    public void testGetPriceHistoryEmpty() {
        String ticker = "INVALID";

        when(stockPriceRepository.findByTickerOrderByPriceDate(ticker)).thenReturn(Arrays.asList());

        List<StockPrice> result = stockPriceService.getPriceHistory(ticker);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(stockPriceRepository, times(1)).findByTickerOrderByPriceDate(ticker);
    }

    @Test
    public void testGetPriceHistorySinglePrice() {
        String ticker = "MSFT";
        LocalDate today = LocalDate.now();

        StockPrice price = new StockPrice();
        TestUtils.setId(price, 1L);
        price.setTicker(ticker);
        price.setPriceDate(today);
        price.setClosePrice(new BigDecimal("300.00"));

        when(stockPriceRepository.findByTickerOrderByPriceDate(ticker)).thenReturn(Arrays.asList(price));

        List<StockPrice> result = stockPriceService.getPriceHistory(ticker);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(ticker, result.get(0).getTicker());
        assertEquals(new BigDecimal("300.00"), result.get(0).getClosePrice());
        verify(stockPriceRepository, times(1)).findByTickerOrderByPriceDate(ticker);
    }
}
