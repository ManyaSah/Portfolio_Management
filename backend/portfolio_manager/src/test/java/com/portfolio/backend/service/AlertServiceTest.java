package com.portfolio.backend.service;

import com.portfolio.backend.TestUtils;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.PriceTargetRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AlertServiceTest {

    @InjectMocks
    private AlertService alertService;

    @Mock
    private PriceTargetRepository priceTargetRepository;

    @Mock
    private StockPriceRepository stockPriceRepository;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testCheckAlertsSellTargetTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("AAPL");
        target.setTargetPrice(new BigDecimal("200.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        StockPrice latestPrice = new StockPrice();
        latestPrice.setTicker("AAPL");
        latestPrice.setClosePrice(new BigDecimal("210.00"));
        latestPrice.setPriceDate(LocalDate.now());

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(stockPriceRepository.findLatestPrice("AAPL")).thenReturn(latestPrice);
        when(priceTargetRepository.save(any(PriceTarget.class))).thenReturn(target);

        alertService.checkAlerts();

        assertTrue(target.isTriggered());
        verify(priceTargetRepository, times(1)).save(target);
    }

    @Test
    public void testCheckAlertsBuyTargetTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("GOOGL");
        target.setTargetPrice(new BigDecimal("3000.00"));
        target.setAction("BUY");
        target.setTriggered(false);

        StockPrice latestPrice = new StockPrice();
        latestPrice.setTicker("GOOGL");
        latestPrice.setClosePrice(new BigDecimal("2900.00"));
        latestPrice.setPriceDate(LocalDate.now());

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(stockPriceRepository.findLatestPrice("GOOGL")).thenReturn(latestPrice);
        when(priceTargetRepository.save(any(PriceTarget.class))).thenReturn(target);

        alertService.checkAlerts();

        assertTrue(target.isTriggered());
        verify(priceTargetRepository, times(1)).save(target);
    }

    @Test
    public void testCheckAlertsNotTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("MSFT");
        target.setTargetPrice(new BigDecimal("400.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        StockPrice latestPrice = new StockPrice();
        latestPrice.setTicker("MSFT");
        latestPrice.setClosePrice(new BigDecimal("350.00"));
        latestPrice.setPriceDate(LocalDate.now());

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(stockPriceRepository.findLatestPrice("MSFT")).thenReturn(latestPrice);

        alertService.checkAlerts();

        assertFalse(target.isTriggered());
        verify(priceTargetRepository, never()).save(any(PriceTarget.class));
    }

    @Test
    public void testCheckAlertsNoPriceData() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("INVALID");
        target.setTargetPrice(new BigDecimal("100.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(stockPriceRepository.findLatestPrice("INVALID")).thenReturn(null);

        alertService.checkAlerts();

        assertFalse(target.isTriggered());
        verify(priceTargetRepository, never()).save(any(PriceTarget.class));
    }

    @Test
    public void testCheckAlertsMultipleTargets() {
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

        StockPrice price1 = new StockPrice();
        price1.setTicker("AAPL");
        price1.setClosePrice(new BigDecimal("210.00"));
        price1.setPriceDate(LocalDate.now());

        StockPrice price2 = new StockPrice();
        price2.setTicker("GOOGL");
        price2.setClosePrice(new BigDecimal("2900.00"));
        price2.setPriceDate(LocalDate.now());

        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList(target1, target2));
        when(stockPriceRepository.findLatestPrice("AAPL")).thenReturn(price1);
        when(stockPriceRepository.findLatestPrice("GOOGL")).thenReturn(price2);
        when(priceTargetRepository.save(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        alertService.checkAlerts();

        assertTrue(target1.isTriggered());
        assertTrue(target2.isTriggered());
        verify(priceTargetRepository, times(2)).save(any(PriceTarget.class));
    }

    @Test
    public void testCheckAlertsNoActiveTargets() {
        when(priceTargetRepository.findByTriggeredFalse()).thenReturn(Arrays.asList());

        alertService.checkAlerts();

        verify(stockPriceRepository, never()).findLatestPrice(anyString());
        verify(priceTargetRepository, never()).save(any(PriceTarget.class));
    }
}
