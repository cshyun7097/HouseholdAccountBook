package com.seunghyun.householdaccountbook.healthcheck;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping("/health-check")
public class HealthCheck {

    @GetMapping
    public ResponseEntity<?> healthCheck() {
        log.info("Health check!");
        return ResponseEntity.ok("Health check OK");
    }
}
