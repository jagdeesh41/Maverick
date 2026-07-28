package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.dto.AssistantChatRequest;
import com.example.bankchain.dto.AssistantChatResponse;
import com.example.bankchain.service.GeminiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final GeminiAssistantService geminiAssistantService;

    /**
     * Backs the "Bank Chain Assistant" chat widget. Proxies to Gemini so
     * the API key never reaches the browser; falls back to a static
     * message if no key is configured or Gemini is unreachable.
     */
    @PostMapping("/chat")
    public ApiResponse<AssistantChatResponse> chat(@Valid @RequestBody AssistantChatRequest request) {
        String reply = geminiAssistantService.chat(request.getRole(), request.getMessage(), request.getHistory());
        return ApiResponse.ok(new AssistantChatResponse(reply));
    }
}
