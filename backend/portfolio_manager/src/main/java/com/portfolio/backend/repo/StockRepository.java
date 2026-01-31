package com.portfolio.backend.repo;

import com.portfolio.backend.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, String> {
}
