package com.portfolio.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class HomeController {

    @GetMapping
    public Map<String, Object> home() {
        return Map.of(
                "message", "Portfolio Manager API",
                "endpoints", Map.of(
                        "assets", "/api/assets",
                        "prices", "/api/prices",
                        "targets", "/api/targets",
                        "portfolio", "/api/portfolio"
                )
        );
    }
}
