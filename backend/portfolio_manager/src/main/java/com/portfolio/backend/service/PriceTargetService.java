package com.portfolio.backend.service;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.repo.PriceTargetRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PriceTargetService {

    private final PriceTargetRepository repository;
    private final PriceService priceService;

    public PriceTargetService(PriceTargetRepository repository, PriceService priceService) {
        this.repository = repository;
        this.priceService = priceService;
    }

    public List<PriceTarget> getActiveTargets() {
        return repository.findByTriggeredFalse();
    }

    public PriceTarget saveTarget(PriceTarget target) {
        return repository.save(target);
    }

    /**
     * Evaluate all active targets using stored latest prices. If a target is hit, mark it triggered and
     * return a human-readable alert message. Returns list of messages for targets that triggered now.
     */
    public List<String> evaluateAndTriggerTargets() {
        List<PriceTarget> targets = repository.findByTriggeredFalse();
        List<String> alerts = new ArrayList<>();

        for (PriceTarget t : targets) {
            var sp = priceService.getLatestPriceForTicker(t.getTicker());
            if (sp == null || sp.getClosePrice() == null) continue;

            try {
                int cmp = sp.getClosePrice().compareTo(t.getTargetPrice());
                boolean triggered;
                if ("BUY".equalsIgnoreCase(t.getAction())) {
                    // BUY when current <= target
                    triggered = cmp <= 0;
                } else {
                    // SELL when current >= target
                    triggered = cmp >= 0;
                }

                if (triggered) {
                    t.setTriggered(true);
                    repository.save(t);
                    String msg = String.format("Target %s %s hit: current %s target %s",
                            t.getTicker(), t.getAction(), sp.getClosePrice().toPlainString(), t.getTargetPrice().toPlainString());
                    alerts.add(msg);
                }
            } catch (Exception ex) {
                // ignore bad data
            }
        }

        return alerts;
    }
}
