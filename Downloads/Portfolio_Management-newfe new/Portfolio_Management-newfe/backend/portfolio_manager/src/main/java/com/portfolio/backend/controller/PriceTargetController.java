package com.portfolio.backend.controller;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.service.PriceTargetService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/targets")
// @CrossOrigin(origins = "http://localhost:3000")
@CrossOrigin(origins = "*")
public class PriceTargetController {

    private final PriceTargetService service;

    public PriceTargetController(PriceTargetService service) {
        this.service = service;
    }

    @GetMapping
    public List<PriceTarget> getTargets() {
        return service.getActiveTargets();
    }

    @PostMapping
    public PriceTarget addTarget(@RequestBody PriceTarget target) {
        return service.saveTarget(target);
    }
}
