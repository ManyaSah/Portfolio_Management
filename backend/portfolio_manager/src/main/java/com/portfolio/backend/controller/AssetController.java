package com.portfolio.backend.controller;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.service.AssetService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/assets")
// @CrossOrigin(origins = "http://localhost:3000")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService service;

    public AssetController(AssetService service) {
        this.service = service;
    }

    @GetMapping
    public List<Asset> getAssets() {
        return service.getAllAssets();
    }

    @PostMapping
    public Asset addAsset(@RequestBody Asset asset) {
        return service.addAsset(asset);
    }

    @PostMapping("/sell")
    public Map<String, Object> sellAsset(@RequestBody Map<String, Object> body) {
        String ticker = (String) body.get("ticker");
        Object qtyObj = body.get("quantity");
        if (ticker == null || qtyObj == null) {
            throw new ResponseStatusException(BAD_REQUEST, "ticker and quantity are required");
        }

        int quantity;
        if (qtyObj instanceof Number) {
            quantity = ((Number) qtyObj).intValue();
        } else {
            quantity = Integer.parseInt(String.valueOf(qtyObj));
        }

        try {
            service.sellAsset(ticker, quantity);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(BAD_REQUEST, ex.getMessage());
        }
        return Map.of("ticker", ticker, "quantitySold", quantity);
    }

    @DeleteMapping("/{id}")
    public void deleteAsset(@PathVariable Long id) {
        service.deleteAsset(id);
    }
}
