package com.example.bankchain.service;

import com.example.bankchain.entity.AuditEvent;
import com.example.bankchain.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    public void log(String eventType, String source, String status, String evidence) {
        AuditEvent event = AuditEvent.builder()
                .eventType(eventType)
                .source(source)
                .status(status)
                .evidence(evidence)
                .build();
        auditEventRepository.save(event);
    }

    public List<AuditEvent> getAllEvents() {
        return auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
    }
}
