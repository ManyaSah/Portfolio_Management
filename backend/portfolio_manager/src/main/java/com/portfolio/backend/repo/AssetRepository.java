package com.portfolio.backend.repo;

import com.portfolio.backend.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
	List<Asset> findByTickerOrderByBuyDateAsc(String ticker);
}
