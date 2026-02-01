package com.portfolio.backend.repo;

import com.portfolio.backend.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {

    List<StockPrice> findByTickerOrderByPriceDate(String ticker);
    @Query("""
    SELECT sp FROM StockPrice sp
    WHERE sp.ticker = :ticker
    ORDER BY sp.priceDate DESC
    LIMIT 1
""")
    StockPrice findLatestPrice(@Param("ticker") String ticker);

}
