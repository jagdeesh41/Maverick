package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AssistantChatRequest {
    @NotBlank
    private String role; // CUSTOMER or RM - shapes which persona/features the assistant leads with

    @NotBlank
    private String message;

    // Prior turns in this chat session, oldest first. Optional - an empty
    // list/null just means "no context yet" (first message in the chat).
    private List<AssistantMessage> history;
}
