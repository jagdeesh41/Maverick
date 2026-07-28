package com.example.bankchain.service;

import com.example.bankchain.dto.AssistantMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Talks to the Gemini API on behalf of the "Bank Chain Assistant" chat
 * widget, so the API key stays server-side and never reaches the browser.
 * If no key is configured, or Gemini is unreachable, or the response
 * doesn't parse as expected, this falls back to a static message instead
 * of failing the request - same degrade-gracefully approach as
 * SmartContractClient uses for the Python rules engine.
 *
 * Uses its own RestTemplate (rather than the shared bean) because Gemini
 * routinely takes several seconds to respond - much longer than the 3s
 * read timeout tuned for the local Python smart-contract engine.
 */
@Service
@Slf4j
public class GeminiAssistantService {

    private static final String FALLBACK_REPLY =
            "I'm not able to reach the assistant service right now. Please contact your " +
            "Relationship Manager or use Help & Support for this query.";

    // Cap on how many prior turns get replayed to Gemini per request, to
    // keep prompt size (and cost) bounded on long-running chat sessions.
    private static final int MAX_HISTORY_TURNS = 10;

    private final RestTemplate restTemplate;

    public GeminiAssistantService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(25))
                .build();
    }

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-3.5-flash}")
    private String model;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    public String chat(String role, String message, List<AssistantMessage> history) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("gemini.api.key not configured - returning static fallback reply");
            return FALLBACK_REPLY;
        }

        try {
            List<Map<String, Object>> contents = new ArrayList<>();
            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - MAX_HISTORY_TURNS);
                for (AssistantMessage turn : history.subList(start, history.size())) {
                    String geminiRole = "assistant".equalsIgnoreCase(turn.getSender()) ? "model" : "user";
                    contents.add(Map.of("role", geminiRole, "parts", List.of(Map.of("text", turn.getText()))));
                }
            }
            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", message))));

            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt(role)))),
                    "contents", contents
            );

            String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            return extractReply(response);
        } catch (RestClientException ex) {
            log.warn("Gemini call failed, returning static fallback reply: {}", ex.getMessage());
            return FALLBACK_REPLY;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> response) {
        try {
            List<Object> candidates = (List<Object>) response.get("candidates");
            Map<String, Object> firstCandidate = (Map<String, Object>) candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            List<Object> parts = (List<Object>) content.get("parts");
            Map<String, Object> firstPart = (Map<String, Object>) parts.get(0);
            String text = (String) firstPart.get("text");
            return (text == null || text.isBlank()) ? FALLBACK_REPLY : text.trim();
        } catch (RuntimeException ex) {
            log.warn("Unexpected Gemini response shape, returning static fallback reply: {}", ex.getMessage());
            return FALLBACK_REPLY;
        }
    }

    private String systemPrompt(String role) {
        boolean isRm = role != null && role.toUpperCase().contains("RM");
        String audience = isRm ? "a Relationship Manager (RM) staff user" : "a bank customer";
        return """
                You are the "Bank Chain Assistant", a virtual Relationship Manager for \
                Lloyds Bank's Bank Chain Digital Asset Fabric platform - a system for \
                tokenizing real-world assets (property, bonds, shares, commodities) with \
                programmable inheritance, transfer/DvP, KYC, recovery, and a full audit trail.

                You are speaking to %s using the platform.

                Platform features you can explain:
                - Issue Asset: customers request tokenization of an asset; it enters an \
                Issuance Queue for RM confirmation before the token is created.
                - My Assets / All Assets: view holdings and cap tables.
                - Transfer / DvP: move a tokenized asset to another party as \
                delivery-versus-payment; needs RM confirmation before it settles.
                - Inheritance: customers set programmable succession rules so assets pass \
                to chosen beneficiaries.
                - Claim a Property: a beneficiary claims an inherited asset; reviewed by an RM.
                - Recovery: regain access to assets after losing credentials, subject to RM approval.
                - KYC: identity verification required before transacting; approved by RMs.
                - RM-only tools: Issuance Queue, Transfer Confirmations, KYC Approvals, \
                Recovery queue, Look Up a Customer, Audit Trail.

                Rules:
                - Only answer questions about Bank Chain, its features, and how the platform works.
                - You do NOT have access to any real account data, balances, or the ability \
                to perform actions (you cannot issue, transfer, approve or look anything up) \
                - if asked to do something account-specific, explain that and point them to \
                the relevant screen or their human Relationship Manager.
                - If asked something unrelated to Bank Chain or banking (general trivia, \
                coding help, other companies, etc.), politely decline and steer back to what \
                you can help with here.
                - Keep answers concise - a few sentences, plain language, no markdown headers.
                """.formatted(audience);
    }
}
