package com.example.bankchain.service;

import com.example.bankchain.dto.InheritancePolicyRequest;
import com.example.bankchain.dto.NomineeDto;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.repository.InheritancePolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Rule 6 (allocation must sum to <= 100%) and the "at least one nominee"
 * guard are enforced here before anything touches the ledger - these tests
 * pin that down so it can't silently regress.
 */
@ExtendWith(MockitoExtension.class)
class InheritanceServiceTest {

    @Mock private InheritancePolicyRepository inheritancePolicyRepository;
    @Mock private AssetService assetService;
    @Mock private AuditService auditService;
    @Mock private SmartContractClient smartContractClient;
    @Mock private NotificationService notificationService;

    private InheritanceService inheritanceService;

    @BeforeEach
    void setUp() {
        inheritanceService = new InheritanceService(
                inheritancePolicyRepository, assetService, auditService, smartContractClient, notificationService);
    }

    private NomineeDto nominee(String name, int percent) {
        NomineeDto dto = new NomineeDto();
        dto.setName(name);
        dto.setRelation("CHILD");
        dto.setAllocationPercent(percent);
        return dto;
    }

    @Test
    void rejectsAllocationsOverOneHundredPercent() {
        Asset asset = Asset.builder().id(1L).build();
        when(assetService.getAssetOrThrow(1L)).thenReturn(asset);
        when(inheritancePolicyRepository.findByAssetId(1L)).thenReturn(Optional.empty());

        InheritancePolicyRequest request = new InheritancePolicyRequest();
        request.setAssetId(1L);
        request.setTriggerCondition("AFTER_DEATH");
        request.setNominees(List.of(nominee("A", 70), nominee("B", 40)));

        assertThatThrownBy(() -> inheritanceService.setPolicy(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("cannot exceed 100%");

        verify(inheritancePolicyRepository, never()).save(any());
    }

    @Test
    void rejectsPolicyWithNoNominees() {
        Asset asset = Asset.builder().id(1L).build();
        when(assetService.getAssetOrThrow(1L)).thenReturn(asset);
        when(inheritancePolicyRepository.findByAssetId(1L)).thenReturn(Optional.empty());

        InheritancePolicyRequest request = new InheritancePolicyRequest();
        request.setAssetId(1L);
        request.setTriggerCondition("AFTER_DEATH");
        request.setNominees(List.of());

        assertThatThrownBy(() -> inheritanceService.setPolicy(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Add at least one nominee");
    }

    @Test
    void acceptsValidAllocationAndSavesPolicy() {
        Asset asset = Asset.builder().id(1L).build();
        when(assetService.getAssetOrThrow(1L)).thenReturn(asset);
        when(inheritancePolicyRepository.findByAssetId(1L)).thenReturn(Optional.empty());
        when(inheritancePolicyRepository.save(any(InheritancePolicy.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InheritancePolicyRequest request = new InheritancePolicyRequest();
        request.setAssetId(1L);
        request.setTriggerCondition("AFTER_DEATH");
        request.setNominees(List.of(nominee("Rahul", 70), nominee("Ananya", 30)));

        InheritancePolicy saved = inheritanceService.setPolicy(request);

        assertThat(saved.getSelfRetainedPercent()).isZero();
        assertThat(saved.getStatus()).isEqualTo("ACTIVE");
        assertThat(saved.getNominees()).hasSize(2);
        verify(auditService).log(eq("Inheritance policy updated"), any(), any(), any());
    }
}
