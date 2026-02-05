package com.portfolio.backend.repo;

import com.portfolio.backend.entity.PriceTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface PriceTargetRepository extends JpaRepository<PriceTarget, Long> {

    List<PriceTarget> findByTriggeredFalse();
}
