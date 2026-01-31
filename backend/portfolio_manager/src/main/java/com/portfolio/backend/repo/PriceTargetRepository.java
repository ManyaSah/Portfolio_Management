package com.portfolio.backend.repo;

import com.portfolio.backend.entity.PriceTarget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceTargetRepository extends JpaRepository<PriceTarget, Long> {

    List<PriceTarget> findByTriggeredFalse();
}
