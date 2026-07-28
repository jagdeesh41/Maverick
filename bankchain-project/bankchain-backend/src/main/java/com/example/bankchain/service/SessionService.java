package com.example.bankchain.service;

import com.example.bankchain.entity.Role;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory bearer-token store backing AuthInterceptor. Tokens live only in
 * this map (single backend instance, demo scope) - a real deployment would
 * swap this for Redis-backed sessions or signed JWTs without touching any
 * caller, same swap-in-a-real-adapter pattern as LedgerService.
 */
@Service
public class SessionService {

    public record Session(Long userId, String username, Role role) {}

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    public String createSession(Long userId, String username, Role role) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, new Session(userId, username, role));
        return token;
    }

    public Session validate(String token) {
        return token != null ? sessions.get(token) : null;
    }

    public void invalidate(String token) {
        if (token != null) {
            sessions.remove(token);
        }
    }
}
