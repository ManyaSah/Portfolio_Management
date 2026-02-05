package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.repo.AssetRepository;
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

public class AssetServiceTest {

    @InjectMocks
    private AssetService assetService;

    @Mock
    private AssetRepository assetRepository;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllAssets() {
        Asset asset1 = new Asset();
        asset1.setTicker("AAPL");
        asset1.setQuantity(10);
        asset1.setBuyPrice(new BigDecimal("150.00"));
        asset1.setBuyDate(LocalDate.now());

        Asset asset2 = new Asset();
        asset2.setTicker("GOOGL");
        asset2.setQuantity(5);
        asset2.setBuyPrice(new BigDecimal("2500.00"));
        asset2.setBuyDate(LocalDate.now());

        List<Asset> assets = Arrays.asList(asset1, asset2);

        when(assetRepository.findAll()).thenReturn(assets);

        List<Asset> result = assetService.getAllAssets();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("AAPL", result.get(0).getTicker());
        assertEquals("GOOGL", result.get(1).getTicker());
        verify(assetRepository, times(1)).findAll();
    }

    @Test
    public void testAddAsset() {
        Asset asset = new Asset();
        asset.setTicker("MSFT");
        asset.setQuantity(20);
        asset.setBuyPrice(new BigDecimal("300.00"));
        asset.setBuyDate(LocalDate.now());

        Asset savedAsset = new Asset();
        savedAsset.setTicker("MSFT");
        savedAsset.setQuantity(20);
        savedAsset.setBuyPrice(new BigDecimal("300.00"));
        savedAsset.setBuyDate(LocalDate.now());
        // Set ID using reflection for mocked return value
        try {
            java.lang.reflect.Field idField = Asset.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(savedAsset, 1L);
        } catch (Exception e) {
            // Ignore reflection errors
        }

        when(assetRepository.save(asset)).thenReturn(savedAsset);

        Asset result = assetService.addAsset(asset);

        assertNotNull(result);
        assertEquals("MSFT", result.getTicker());
        verify(assetRepository, times(1)).save(asset);
    }

    @Test
    public void testSellAssetPartialLot() {
        String ticker = "AAPL";
        int quantityToSell = 5;

        Asset lot = new Asset();
        lot.setTicker(ticker);
        lot.setQuantity(10);
        lot.setBuyPrice(new BigDecimal("150.00"));
        lot.setBuyDate(LocalDate.now());
        // Set ID using reflection for test
        try {
            java.lang.reflect.Field idField = Asset.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(lot, 1L);
        } catch (Exception e) {
            // Ignore reflection errors
        }

        when(assetRepository.findByTickerOrderByBuyDateAsc(ticker)).thenReturn(Arrays.asList(lot));
        when(assetRepository.save(any(Asset.class))).thenReturn(lot);

        assetService.sellAsset(ticker, quantityToSell);

        assertEquals(5, lot.getQuantity());
        verify(assetRepository, times(1)).save(lot);
        verify(assetRepository, never()).deleteById(anyLong());
    }

    @Test
    public void testSellAssetFullLot() {
        String ticker = "GOOGL";
        int quantityToSell = 5;

        Asset lot = new Asset();
        lot.setTicker(ticker);
        lot.setQuantity(5);
        lot.setBuyPrice(new BigDecimal("2500.00"));
        lot.setBuyDate(LocalDate.now());
        // Set ID using reflection for test
        try {
            java.lang.reflect.Field idField = Asset.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(lot, 1L);
        } catch (Exception e) {
            // Ignore reflection errors
        }

        when(assetRepository.findByTickerOrderByBuyDateAsc(ticker)).thenReturn(Arrays.asList(lot));

        assetService.sellAsset(ticker, quantityToSell);

        verify(assetRepository, times(1)).deleteById(1L);
        verify(assetRepository, never()).save(any(Asset.class));
    }

    @Test
    public void testSellAssetMultipleLots() {
        String ticker = "MSFT";
        int quantityToSell = 15;

        Asset lot1 = new Asset();
        lot1.setTicker(ticker);
        lot1.setQuantity(10);
        lot1.setBuyPrice(new BigDecimal("300.00"));
        lot1.setBuyDate(LocalDate.now().minusDays(10));
        // Set ID using reflection for test
        try {
            java.lang.reflect.Field idField = Asset.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(lot1, 1L);
        } catch (Exception e) {
            // Ignore reflection errors
        }

        Asset lot2 = new Asset();
        lot2.setTicker(ticker);
        lot2.setQuantity(10);
        lot2.setBuyPrice(new BigDecimal("310.00"));
        lot2.setBuyDate(LocalDate.now());
        // Set ID using reflection for test
        try {
            java.lang.reflect.Field idField = Asset.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(lot2, 2L);
        } catch (Exception e) {
            // Ignore reflection errors
        }

        when(assetRepository.findByTickerOrderByBuyDateAsc(ticker)).thenReturn(Arrays.asList(lot1, lot2));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assetService.sellAsset(ticker, quantityToSell);

        verify(assetRepository, times(1)).deleteById(1L);
        verify(assetRepository, times(1)).save(lot2);
        assertEquals(5, lot2.getQuantity());
    }

    @Test
    public void testSellAssetInvalidQuantity() {
        String ticker = "AAPL";

        assertThrows(IllegalArgumentException.class, () -> {
            assetService.sellAsset(ticker, 0);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            assetService.sellAsset(ticker, -1);
        });

        verify(assetRepository, never()).findByTickerOrderByBuyDateAsc(anyString());
    }

    @Test
    public void testSellAssetInsufficientShares() {
        String ticker = "AAPL";
        int quantityToSell = 20;

        Asset lot = new Asset();
        lot.setTicker(ticker);
        lot.setQuantity(10);
        lot.setBuyPrice(new BigDecimal("150.00"));
        lot.setBuyDate(LocalDate.now());

        when(assetRepository.findByTickerOrderByBuyDateAsc(ticker)).thenReturn(Arrays.asList(lot));

        assertThrows(IllegalArgumentException.class, () -> {
            assetService.sellAsset(ticker, quantityToSell);
        });

        verify(assetRepository, never()).save(any(Asset.class));
        verify(assetRepository, never()).deleteById(anyLong());
    }

    @Test
    public void testDeleteAsset() {
        Long assetId = 1L;

        doNothing().when(assetRepository).deleteById(assetId);

        assetService.deleteAsset(assetId);

        verify(assetRepository, times(1)).deleteById(assetId);
    }
}
