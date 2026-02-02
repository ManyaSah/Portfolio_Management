package com.portfolio.backend.controller;

import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.service.PriceService;
import com.portfolio.backend.service.StockPriceService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prices")
@CrossOrigin
public class StockPriceController {

    private final StockPriceService historyService;
    private final PriceService priceService;

    public StockPriceController(StockPriceService historyService, PriceService priceService) {
        this.historyService = historyService;
        this.priceService = priceService;
    }

    @GetMapping("/{ticker}")
    public List<StockPrice> getPriceHistory(@PathVariable String ticker) {
        return historyService.getPriceHistory(ticker);
    }

    @PostMapping
    public StockPrice addPrice(@RequestBody Map<String, Object> body) {
        String ticker = (String) body.get("ticker");
        Object p = body.get("price");
        BigDecimal price;
        if (p instanceof Number) {
            price = BigDecimal.valueOf(((Number) p).doubleValue());
        } else {
            price = new BigDecimal(String.valueOf(p));
        }
        return priceService.createPrice(ticker, price);
    }
}
