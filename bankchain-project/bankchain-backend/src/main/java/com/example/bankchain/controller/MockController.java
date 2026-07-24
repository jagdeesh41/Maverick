package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.entity.AuditEvent;
import com.example.bankchain.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Legal/Executor and Compliance/Audit are out of scope for full build-out
 * right now - these endpoints back their screens with static/mocked data
 * plus a read-only view of real audit events, so the UI dropdown for all
 * 4 access types still works end-to-end for the demo.
 */
@RestController
@RequestMapping("/mock")
@RequiredArgsConstructor
public class MockController {

    private final AuditService auditService;

    @GetMapping("/legal/claims")
    public ApiResponse<List<Map<String, Object>>> legalClaims() {
        return ApiResponse.ok(List.of(
                Map.of("request", "RE-456 nominee dispute", "status", "Pending", "stage", "Legal review"),
                Map.of("request", "FD-123 succession claim", "status", "Approved", "stage", "Rule execution")
        ));
    }

    @GetMapping("/compliance/monitoring")
    public ApiResponse<Map<String, Object>> complianceMonitoring() {
        return ApiResponse.ok(Map.of(
                "sanctionsAlerts", 0,
                "amlTriggers", 1,
                "activeFreezes", 1,
                "recentAuditEvents", auditService.getAllEvents()
        ));
    }
}
