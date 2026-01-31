package com.portfolio.backend.repo;

import com.portfolio.backend.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {

    List<StockPrice> findByTickerOrderByPriceDate(String ticker);
}
