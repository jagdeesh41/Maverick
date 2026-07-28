package com.example.bankchain.config;

import com.example.bankchain.entity.*;
import com.example.bankchain.repository.*;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final AssetHoldingRepository holdingRepository;
    private final TransferRepository transferRepository;
    private final KycRepository kycRepository;
    private final RecoveryRequestRepository recoveryRequestRepository;
    private final InheritancePolicyRepository inheritancePolicyRepository;
    private final PropertyClaimRepository propertyClaimRepository;
    private final LedgerService ledgerService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    // A real, valid placeholder PNG (base64) - so seed data actually renders
    // as an image on RM screens, same as a real uploaded photo would. Real
    // uploads from the frontend's FileUpload component produce this exact
    // "data:<mime>;base64,...." shape via FileReader.readAsDataURL, so
    // <img src={value}> just works - no separate file server needed.
    private static final String PLACEHOLDER_PROOF = "data:image/png;base64," +
            "iVBORw0KGgoAAAANSUhEUgAAASwAAADICAIAAADdvUsCAAAIjklEQVR4nO3Za3BU5R3H8f/mHkxGuYUQSCAJBBIIhMolBBIEQhlx" +
            "EEWocpHW0U5bCzgRKFL1hfRiW6VQ6NipHWlLhzgVb7SIQ4qKEDCiCCKQcAsESBoIBJBLDHvri83Etbu5gMpvAt/Pq82Tc57z7Ml+" +
            "55yzcVTVVBsAnRD1AoCbHRECYkQIiBEhIEaEgBgRAmJECIgRISBGhIBYWPO/Tl869/qsA7ixlRYsb+pXXAkBMSIExFq4HW3UzMUU" +
            "QFNa80DHlRAQI0JAjAgBMSIExIgQECNCQIwIATEiBMSIEBAjQkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQIwIATEiBMSIEBAj" +
            "QkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQIwIATEiBMSIEBAjQkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQIwIATEiBMSI" +
            "EBAjQkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQIwIATEiBMSIEBAjQkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQIwIATEi" +
            "BMSIEBAjQkCMCAExIgTEiBAQI0JAjAgBMSIExIgQECNCQCxMvYBrtO/U8SXF/3a53aEhIb/+7vT42PZm9uqeDxa/+8p7jyzu2C7W" +
            "zLJWzBud0n/pXQ/5dvnZ26uKDn26a84SMxu0Yl5mfA+HOVwe9xN3TM7skjT0hYXbH/2t/yF82/hej0nJ/MHto/3H/ff1jXi93kvO" +
            "+kWjJg/p3uv1vSWrd20JDw11ut0PDhp1T8ZQMws62OJRnB7X1P459/Yb1tQMaz7b9vLu4lvCI9tFRD4z9n7fqfB/O42vWzwh/svI" +
            "WjFvYHzPv0+d4z/JxkO7V+3cZGafVJZ/p1uKmc3IyhvfO+ub+aPerNpqhE8WFf7pnh/Fx9xWdHDX7za/+fu7HjKz98r3PJg16v0j" +
            "eyf3yzaziNCwI7Un3V5PqCPEa95j509HhDa83/DQsFVT55rZgdNVTxYVrpk+P/AQjds0Nd64r//IgrdXLcib9Nqekr9NmR0bGX2h" +
            "vu7Hb/65S8ytbq8ncHB4Up8Wj1LnvPLo2hejwyNiIqMCZ/B6vW/t31F4f0FUWPjmo/sWbVj91ymzmzpprTkh/hu7ve7tJw4O7d67" +
            "cTC/14D8XgPMbOgLC4MuG9egrd6Onrl84YrLaWZjUjNnZOWZ2ReuK5ed9VMyczaV723cLKNL4p7qY2ZWdqqyT6eEwHnSOiWcOH/m" +
            "2tYQuG/vTl1PXjz30sfvLMibFBsZbWaxkdHzcyf95aONQQdbc5To8Ij5uZP+sfP9oDOs3PFuwYiJUWHhZpbXMyPxtk4uj7uZ2Vo8" +
            "If5mD5+wYtv61iwSX0dbjbBgxMQZr/zhqaLCHZXlt3dLNbPio2W5PTOS28dVfl7rdDd8EEf2SC+uKDWz4orSkT3TA+cpOXagb1y3" +
            "a1tD4L5bK8qyE9PKa0+md+7eOJgR1/1wbXXQwVYeqE/nhIpzNUFnOHTmv+lxXw4uzn8gLCS0malaPCH+shPTzOzD4wdbuU5cm7Z6" +
            "O3pvv2FjUzM3Ht797KbX8nsNnD38zncO7y6rqdxwYOepS+c/OnEwp0dfMxvRo2/hp5t/mn1nyfGD0wbmNu7udLtmrVnu9XpjI6N/" +
            "OW560EP4tvG9fnzkxKyuyU3t6xtxedzltSfXzfr5fYXP+c/jNXOYeb86uW/w/47yTP4Dye3jAlfi8njCQ0I9X53DN4Pb6w3cvhnN" +
            "n5DANzsnZ8LybeuHJT52VUfBVWmTEdbWXaw4WzMoIXlyv+w7UvrfverZn2SPP3q25o2ZC82suKJ005G9vghvjWrnMEf1hbNmFhMR" +
            "1ThDU09i/lp8WgsceenjjW/s+zC1Q/y+UycGJTR8jvedOt6rY1eP1xs42MqVfFZdkdYpwelxB85Q73KW1VQOiO9hZl7zLtqw+jfj" +
            "Z5qZw+HwPfu5PZ5Qx5f3O1d7QoZ27x3qCCk5fqD5FeLraJO3ow5zFLy10vdJOld3KSG2/c6qI307N9wZDu6WurWirHHj3J4ZS7eu" +
            "y0lKuw4Ly0nqu7u64uHBY5/fsvZCfZ2ZXaivW7LlX48Mzg862Jo5P//i8vNb1j48ZGzQGaYPzF22dd0Vt8vM1u//xPfCzDK7JG2r" +
            "2G9mxRWlmfFJ/hNe7QmZkzPhjx/wZPgtapNXwvbRtyzOn/bYupVRYREhIY5fjZ/x+t6SYYkNX+JFhUV0iI45XHvS9+OolH7Ltq5b" +
            "O+uJ5ud0ul0z/rnM93pQQsr83Lv979CyuiY/PnJiiwtL7hB34HTV8KQ+1RfPff/VFRGhYU63e2ZWXnZSmpkFHWxmPbPWLPf9I+SH" +
            "Q8b5vqIMOsPRczX3rX6uQ3RMx3YxT4/5nm/3p0ZPefo/L7+4vcjMfjFumv/MQU9IM292cLfU8JCwxrzxjXNU1TT39UD60oZblNKC" +
            "5ddlPcANpTUFtcnbUeBGQoSAGBECYkQIiBEhIEaEgBgRAmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaEgBgRAmJE" +
            "CIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaEgBgRAmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaEgBgR" +
            "AmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaEgBgRAmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaE" +
            "gBgRAmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYkQIiBEhIEaEgBgRAmJECIgRISBGhIAYEQJiRAiIESEgRoSAGBECYmGt3C59" +
            "6dxvdR3ATYsrISBGhICYo6qmWr0G4KbGlRAQI0JAjAgBMSIExIgQECNCQIwIATEiBMT+ByLr+klwykH0AAAAAElFTkSuQmCC";

    private String proof(String label) {
        return PLACEHOLDER_PROOF;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled || userRepository.count() > 0) {
            return;
        }

        // ---- Users (6) ----
        User priyal = userRepository.save(User.builder().username("priyal").fullName("Priyal Agarwal").role(Role.CUSTOMER).enabled(true).build());
        User rahul = userRepository.save(User.builder().username("rahul").fullName("Rahul Sharma").role(Role.CUSTOMER).enabled(true).build());
        User ananya = userRepository.save(User.builder().username("ananya").fullName("Ananya Iyer").role(Role.CUSTOMER).enabled(true).build());
        User rmAdmin = userRepository.save(User.builder().username("rm.admin").fullName("RM Admin").role(Role.RM).enabled(true).build());
        userRepository.save(User.builder().username("legal.exec").fullName("Legal Executor").role(Role.LEGAL).enabled(true).build());
        userRepository.save(User.builder().username("compliance.audit").fullName("Compliance Auditor").role(Role.COMPLIANCE).enabled(true).build());

        // ---- Assets + holdings (5) ----
        // Fixed Deposit / Bond / Equity / Commodity = fully owned (100%) once issued.
        // Real Estate here is only 60% owned (e.g. mortgage still outstanding).
        Asset a1 = saveAsset(priyal, "Fixed Deposit", "500000", 1000, 100, "Maturity lock + nominee + payout",
                "Rahul Sharma", "FAMILY", "ACTIVE");
        holdingRepository.save(AssetHolding.builder().asset(a1).holder(priyal).unitsHeld(1000).build());

        Asset a2 = saveAsset(priyal, "Real Estate", "750000", 500, 60, "Death benefit only",
                "Ananya Iyer", "RELATIVE", "ACTIVE");
        holdingRepository.save(AssetHolding.builder().asset(a2).holder(priyal).unitsHeld(500).build());

        Asset a3 = saveAsset(rahul, "Corporate Bond", "300000", 300, 100, "Immediate transfer on approval",
                "Priyal Agarwal", "FRIEND", "PENDING_CONFIRMATION");
        holdingRepository.save(AssetHolding.builder().asset(a3).holder(rahul).unitsHeld(300).build());

        Asset a4 = saveAsset(ananya, "Equity", "120000", 200, 100, "Age-based release (70+)",
                "Rahul Sharma", "FAMILY_FRIEND", "ON_HOLD");
        a4.setRmNote("Please upload a clearer photo of the share certificate.");
        assetRepository.save(a4);
        holdingRepository.save(AssetHolding.builder().asset(a4).holder(ananya).unitsHeld(200).build());

        Asset a5 = saveAsset(rahul, "Commodity", "80000", 400, 100, "Custom — set in Inheritance screen",
                "Ananya Iyer", "RELATIVE", "FROZEN");
        holdingRepository.save(AssetHolding.builder().asset(a5).holder(rahul).unitsHeld(400).build());

        // ---- Transfers (3) - with buyer proof + consent ----
        transferRepository.save(Transfer.builder().asset(a1).seller(priyal).buyerCustomerId("rahul")
                .units(100).settlementRail("Tokenised deposit rail")
                .transfereeProofBase64(PLACEHOLDER_PROOF)
                .buyerProofType("ACCOUNT_NUMBER").buyerProofValue("400123456789").consentGiven(true)
                .status("LOCKED").build());

        transferRepository.save(Transfer.builder().asset(a2).seller(priyal).buyerCustomerId("ananya")
                .units(50).settlementRail("Tokenised deposit rail")
                .transfereeProofBase64(PLACEHOLDER_PROOF)
                .buyerProofType("ID_NUMBER").buyerProofValue("ID998877665").consentGiven(true)
                .status("ON_HOLD").rmNote("Please confirm buyer's relationship to the seller.").build());

        transferRepository.save(Transfer.builder().asset(a3).seller(rahul).buyerCustomerId("priyal")
                .units(50).settlementRail("Tokenised deposit rail")
                .transfereeProofBase64(PLACEHOLDER_PROOF)
                .buyerProofType("ACCOUNT_NUMBER").buyerProofValue("400111222333").consentGiven(true)
                .status("SETTLED").build());

        // ---- KYC (3) ----
        kycRepository.save(Kyc.builder().user(priyal).documentType("Passport").documentNumber("P1234567")
                .proofPhotoBase64(PLACEHOLDER_PROOF).status("APPROVED").build());
        kycRepository.save(Kyc.builder().user(rahul).documentType("Driver's License").documentNumber("DL9988776")
                .proofPhotoBase64(PLACEHOLDER_PROOF).status("PENDING").build());
        kycRepository.save(Kyc.builder().user(ananya).documentType("National ID").documentNumber("NID5544332")
                .proofPhotoBase64(PLACEHOLDER_PROOF).status("PENDING").build());

        // ---- Recovery requests (2) ----
        recoveryRequestRepository.save(RecoveryRequest.builder().user(rahul)
                .recoveryReason("Lost device").verificationMethod("Bank KYC + MFA")
                .phoneNumber("+91-9800011122").email("rahul.sharma@example.com")
                .proofDocumentBase64(PLACEHOLDER_PROOF).status("IDENTITY_PROOFING")
                .createdAt(LocalDateTime.now()).build());

        recoveryRequestRepository.save(RecoveryRequest.builder().user(ananya)
                .recoveryReason("Changed phone number").verificationMethod("Bank KYC + MFA")
                .phoneNumber("+91-9811122233").email("ananya.iyer@example.com")
                .proofDocumentBase64(PLACEHOLDER_PROOF).status("REQUESTED")
                .createdAt(LocalDateTime.now()).build());

        // ---- Inheritance policy (1) - dynamic nominee list ----
        InheritancePolicy policy = InheritancePolicy.builder()
                .asset(a1)
                .triggerCondition("AFTER_DEATH")
                .selfRetainedPercent(0)
                .proofDocumentBase64(PLACEHOLDER_PROOF)
                .disputeAction("Temporary freeze")
                .status("ACTIVE")
                .build();
        policy.getNominees().add(Nominee.builder().policy(policy).name("Rahul Sharma").relation("CHILD")
                .allocationPercent(70).proofType("ID_NUMBER").proofValue("ID112233445").build());
        policy.getNominees().add(Nominee.builder().policy(policy).name("Ananya Iyer").relation("SIBLING")
                .allocationPercent(30).proofType("ID_NUMBER").proofValue("ID556677889").build());
        inheritancePolicyRepository.save(policy);

        // ---- Property claim (1) ----
        propertyClaimRepository.save(PropertyClaim.builder()
                .asset(a5).claimant(ananya).claimantRelation("SIBLING")
                .certificateProofBase64(PLACEHOLDER_PROOF).status("SUBMITTED")
                .createdAt(LocalDateTime.now()).build());
    }

    private Asset saveAsset(User issuer, String type, String value, int units, int ownershipPercent,
                             String policyTemplate, String nominee, String relationType, String status) {
        String tokenId = ledgerService.mint(null, new BigDecimal(value), units);
        return assetRepository.save(Asset.builder()
                .issuer(issuer)
                .assetType(type)
                .assetValue(new BigDecimal(value))
                .ownershipUnits(units)
                .ownershipPercent(ownershipPercent)
                .policyTemplate(policyTemplate)
                .nominee(nominee)
                .relationType(relationType)
                .proofDocumentBase64(PLACEHOLDER_PROOF)
                .status(status)
                .ledgerTokenId(tokenId)
                .evidenceHash("Qm" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .createdAt(LocalDateTime.now())
                .build());
    }
}
