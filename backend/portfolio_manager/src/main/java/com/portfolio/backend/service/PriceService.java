package com.portfolio.backend.service;

import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.StockPriceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class PriceService {

    private final StockPriceRepository stockPriceRepository;

    public PriceService(StockPriceRepository stockPriceRepository) {
        this.stockPriceRepository = stockPriceRepository;
    }

    public StockPrice getLatestPriceForTicker(String ticker) {
        return stockPriceRepository.findTopByTickerOrderByFetchedAtDesc(ticker);
    }

    public StockPrice createPrice(String ticker, BigDecimal price) {
        StockPrice sp = new StockPrice();
        sp.setTicker(ticker);
        sp.setClosePrice(price);
        // Use priceDate as fetchedAt equivalent
        sp.setPriceDate(LocalDate.now());
        return stockPriceRepository.save(sp);
    }
}
