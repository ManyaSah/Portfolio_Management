package com.portfolio.backend.repo;

import com.portfolio.backend.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {

    List<StockPrice> findByTickerOrderByPriceDate(String ticker);
    @Query("""
    SELECT sp FROM StockPrice sp
    WHERE sp.ticker = :ticker
    ORDER BY sp.priceDate DESC
    LIMIT 1
""")
    StockPrice findLatestPrice(@Param("ticker") String ticker);

    // Provide the method the rest of the app expects (findTopByTickerOrderByFetchedAtDesc)
    // We implement it as a default method that uses the existing ordered list so we don't
    // need to change the entity or the database schema.
    default StockPrice findTopByTickerOrderByFetchedAtDesc(String ticker) {
        List<StockPrice> list = findByTickerOrderByPriceDate(ticker);
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(list.size() - 1);
    }

}
