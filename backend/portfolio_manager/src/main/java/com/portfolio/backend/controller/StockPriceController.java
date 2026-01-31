package com.portfolio.backend.controller;

import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.service.StockPriceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prices")
@CrossOrigin
public class StockPriceController {

    private final StockPriceService service;

    public StockPriceController(StockPriceService service) {
        this.service = service;
    }

    @GetMapping("/{ticker}")
    public List<StockPrice> getPriceHistory(@PathVariable String ticker) {
        return service.getPriceHistory(ticker);
    }
}
