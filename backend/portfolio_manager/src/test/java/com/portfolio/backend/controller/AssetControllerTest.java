package com.portfolio.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.service.AssetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AssetControllerTest {
    private MockMvc mockMvc;
    
    @Mock
    private AssetService assetService;
    
    @InjectMocks
    private AssetController assetController;
    
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(assetController).build();
    }

    @Test
    public void testGetAllAssets() throws Exception {
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

        when(assetService.getAllAssets()).thenReturn(assets);

        mockMvc.perform(get("/api/assets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[1].ticker").value("GOOGL"));

        verify(assetService, times(1)).getAllAssets();
    }


    @Test
    public void testSellAsset() throws Exception {
        String ticker = "AAPL";
        int quantity = 5;

        doNothing().when(assetService).sellAsset(eq(ticker), eq(quantity));

        mockMvc.perform(post("/api/assets/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticker\":\"AAPL\",\"quantity\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value("AAPL"))
                .andExpect(jsonPath("$.quantitySold").value(5));

        verify(assetService, times(1)).sellAsset(eq(ticker), eq(quantity));
    }

    @Test
    public void testSellAssetMissingTicker() throws Exception {
        mockMvc.perform(post("/api/assets/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":5}"))
                .andExpect(status().isBadRequest());

        verify(assetService, never()).sellAsset(anyString(), anyInt());
    }

    @Test
    public void testSellAssetMissingQuantity() throws Exception {
        mockMvc.perform(post("/api/assets/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticker\":\"AAPL\"}"))
                .andExpect(status().isBadRequest());

        verify(assetService, never()).sellAsset(anyString(), anyInt());
    }

    @Test
    public void testSellAssetInvalidQuantity() throws Exception {
        doThrow(new IllegalArgumentException("Sell quantity must be greater than 0"))
                .when(assetService).sellAsset(eq("AAPL"), eq(-1));

        mockMvc.perform(post("/api/assets/sell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticker\":\"AAPL\",\"quantity\":-1}"))
                .andExpect(status().isBadRequest());

        verify(assetService, times(1)).sellAsset(eq("AAPL"), eq(-1));
    }

    @Test
    public void testDeleteAsset() throws Exception {
        Long assetId = 1L;

        doNothing().when(assetService).deleteAsset(assetId);

        mockMvc.perform(delete("/api/assets/{id}", assetId))
                .andExpect(status().isOk());

        verify(assetService, times(1)).deleteAsset(assetId);
    }
}
