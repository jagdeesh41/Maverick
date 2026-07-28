package com.example.bankchain.config;

import com.example.bankchain.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthInterceptorTest {

    @Mock
    private SessionService sessionService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private AuthInterceptor authInterceptor;

    @Test
    void allowsCorsPreflightRequestsWithoutAuthentication() throws Exception {
        when(request.getMethod()).thenReturn("OPTIONS");
        when(request.getHeader("Origin")).thenReturn("http://localhost:5173");
        when(request.getHeader("Access-Control-Request-Headers")).thenReturn("Authorization, Content-Type");

        boolean allowed = authInterceptor.preHandle(request, response, new Object());

        assertTrue(allowed);
        verify(response).setStatus(HttpServletResponse.SC_OK);
        verify(response).setHeader(eq("Access-Control-Allow-Origin"), anyString());
    }
}
