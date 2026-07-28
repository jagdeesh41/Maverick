package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistantMessage {
    private String sender; // "user" or "assistant"
    private String text;
}
