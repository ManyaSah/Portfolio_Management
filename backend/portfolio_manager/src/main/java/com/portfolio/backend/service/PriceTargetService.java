package com.portfolio.backend.service;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.repo.PriceTargetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PriceTargetService {

    private final PriceTargetRepository repository;

    public PriceTargetService(PriceTargetRepository repository) {
        this.repository = repository;
    }

    public List<PriceTarget> getActiveTargets() {
        return repository.findByTriggeredFalse();
    }

    public PriceTarget saveTarget(PriceTarget target) {
        return repository.save(target);
    }
}
