package com.portfolio.backend.service;

import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.StockPriceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockPriceService {

    private final StockPriceRepository repository;

    public StockPriceService(StockPriceRepository repository) {
        this.repository = repository;
    }

    public List<StockPrice> getPriceHistory(String ticker) {
        return repository.findByTickerOrderByPriceDate(ticker);
    }
}
