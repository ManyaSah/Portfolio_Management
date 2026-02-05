package com.portfolio.backend.repo;

import com.portfolio.backend.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {
	List<Asset> findByTickerOrderByBuyDateAsc(String ticker);
}
