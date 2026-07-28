package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventType; // "Asset issued", "DvP transfer", "Customer login"...

    @Column(nullable = false)
    private String source; // "IAM", "Smart contract + ledger", "Evidence vault", "Settlement layer"

    @Column(nullable = false)
    private String status; // Success, Recorded, Linked, Pending

    private String evidence; // "Tx: 0xA93...FD", "Hash: Qm742...9B"

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
