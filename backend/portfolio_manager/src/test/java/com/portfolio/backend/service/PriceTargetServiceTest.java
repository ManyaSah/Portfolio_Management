package com.portfolio.backend.service;

import com.portfolio.backend.TestUtils;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.PriceTargetRepository;
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

public class PriceTargetServiceTest {

    @InjectMocks
    private PriceTargetService priceTargetService;

    @Mock
    private PriceTargetRepository repository;

    @Mock
    private PriceService priceService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetActiveTargets() {
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

        when(repository.findByTriggeredFalse()).thenReturn(targets);

        List<PriceTarget> result = priceTargetService.getActiveTargets();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("AAPL", result.get(0).getTicker());
        assertEquals("GOOGL", result.get(1).getTicker());
        verify(repository, times(1)).findByTriggeredFalse();
    }

    @Test
    public void testSaveTarget() {
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

        when(repository.save(target)).thenReturn(savedTarget);

        PriceTarget result = priceTargetService.saveTarget(target);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("MSFT", result.getTicker());
        verify(repository, times(1)).save(target);
    }

    @Test
    public void testEvaluateAndTriggerTargetsSellTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("AAPL");
        target.setTargetPrice(new BigDecimal("200.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        StockPrice stockPrice = new StockPrice();
        stockPrice.setTicker("AAPL");
        stockPrice.setClosePrice(new BigDecimal("210.00"));
        stockPrice.setPriceDate(LocalDate.now());

        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(stockPrice);
        when(repository.save(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(1, alerts.size());
        assertTrue(target.isTriggered());
        verify(repository, times(1)).save(target);
    }

    @Test
    public void testEvaluateAndTriggerTargetsBuyTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("GOOGL");
        target.setTargetPrice(new BigDecimal("3000.00"));
        target.setAction("BUY");
        target.setTriggered(false);

        StockPrice stockPrice = new StockPrice();
        stockPrice.setTicker("GOOGL");
        stockPrice.setClosePrice(new BigDecimal("2900.00"));
        stockPrice.setPriceDate(LocalDate.now());

        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(priceService.getLatestPriceForTicker("GOOGL")).thenReturn(stockPrice);
        when(repository.save(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(1, alerts.size());
        assertTrue(target.isTriggered());
        verify(repository, times(1)).save(target);
    }

    @Test
    public void testEvaluateAndTriggerTargetsNotTriggered() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("MSFT");
        target.setTargetPrice(new BigDecimal("400.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        StockPrice stockPrice = new StockPrice();
        stockPrice.setTicker("MSFT");
        stockPrice.setClosePrice(new BigDecimal("350.00"));
        stockPrice.setPriceDate(LocalDate.now());

        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(priceService.getLatestPriceForTicker("MSFT")).thenReturn(stockPrice);

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(0, alerts.size());
        assertFalse(target.isTriggered());
        verify(repository, never()).save(any(PriceTarget.class));
    }

    @Test
    public void testEvaluateAndTriggerTargetsNoPriceData() {
        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("INVALID");
        target.setTargetPrice(new BigDecimal("100.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList(target));
        when(priceService.getLatestPriceForTicker("INVALID")).thenReturn(null);

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(0, alerts.size());
        assertFalse(target.isTriggered());
        verify(repository, never()).save(any(PriceTarget.class));
    }

    @Test
    public void testEvaluateAndTriggerTargetsMultipleTargets() {
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

        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList(target1, target2));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(price1);
        when(priceService.getLatestPriceForTicker("GOOGL")).thenReturn(price2);
        when(repository.save(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(2, alerts.size());
        assertTrue(target1.isTriggered());
        assertTrue(target2.isTriggered());
        verify(repository, times(2)).save(any(PriceTarget.class));
    }

    @Test
    public void testEvaluateAndTriggerTargetsNoActiveTargets() {
        when(repository.findByTriggeredFalse()).thenReturn(Arrays.asList());

        List<String> alerts = priceTargetService.evaluateAndTriggerTargets();

        assertNotNull(alerts);
        assertEquals(0, alerts.size());
        verify(priceService, never()).getLatestPriceForTicker(anyString());
    }
}
