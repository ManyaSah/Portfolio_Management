package com.portfolio.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ApplicationSmokeTest {

    @Test
    void contextLoads() {
        // If this fails, application wiring is broken
        assertTrue(true);
    }
}
