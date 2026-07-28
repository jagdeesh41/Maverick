package com.example.bankchain.config;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.entity.Role;
import com.example.bankchain.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Guards every /customer/** and /rm/** call behind a valid bearer token
 * issued at POST /auth/login. Previously these endpoints had no auth check
 * at all - any client could hit any userId/assetId path. /rm/** additionally
 * requires the RM role, since that's the operations/approval surface.
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String header = request.getHeader("Authorization");
        String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;

        SessionService.Session session = sessionService.validate(token);
        if (session == null) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated - please log in again.");
            return false;
        }

        if (request.getRequestURI().startsWith("/rm/") && session.role() != Role.RM) {
            reject(response, HttpServletResponse.SC_FORBIDDEN, "This action requires the Relationship Manager role.");
            return false;
        }

        request.setAttribute("sessionUserId", session.userId());
        request.setAttribute("sessionRole", session.role());
        return true;
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error(message)));
    }
}
