package com.portfolio.backend.controller;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.repo.PriceTargetRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final PriceTargetRepository priceTargetRepository;

    public AlertController(PriceTargetRepository priceTargetRepository) {
        this.priceTargetRepository = priceTargetRepository;
    }

    @GetMapping
    public List<PriceTarget> getAllAlerts() {
        return priceTargetRepository.findAll();
    }

    @GetMapping("/active")
    public List<PriceTarget> getActiveAlerts() {
        return priceTargetRepository.findByTriggeredFalse();
    }
}
